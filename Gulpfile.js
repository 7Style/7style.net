var gulp = require('gulp'),
        $ = require('gulp-load-plugins')({lazy: true}),
        del = require('del'),
        fs = require('fs'),
        lazypipe = require('lazypipe'),
        merge2 = require('merge2'),
        path = require('path'),
        runSequence = require('run-sequence'),
        source = require('vinyl-source-stream'),
        templates = require('./tasks/templates'),
        touch = require('touch');

function compileJs(options, cb) {
    var babel = require('babelify'),
            browserify = require('browserify'),
            buffer = require('vinyl-buffer'),
            closureCompile = require('./tasks/compile').closureCompile,
            watchify = require('watchify');
    
    options = options || {};
    
    var srcDir = './src/';
    var srcFilename = 'index.js';
    var destDir = './dist/';
    var destFilename = 'script.js';
    
    var bundler = browserify(srcDir + srcFilename, {debug: true, paths: ['src/']}).transform(babel);
    var activeBundleOperationCount = 0;
    
    if (options.watch) {
        bundler = watchify(bundler);
        bundler.on('update', function () {
            console.log('-> bundling ' + srcDir + '...');
            
            runSequence(
                    'clean:watch',
                    ['compile-dev', 'lib-dev', 'templates-dev', 'css-dev'],
                    ['revision', 'static'],
                    ['process-html-dev'],
                    'clean:after',
                    'reload'
            );
        });
    }
    
    function rebundle(cb) {
        activeBundleOperationCount++;
        bundler.bundle().on('error', function (err) {
            console.error(err);
            this.emit('end');
        }).pipe(lazybuild()).pipe($.rename(destFilename)).pipe(lazywrite()).on('end', function () {
            activeBundleOperationCount--;
            if (activeBundleOperationCount == 0) {
                console.info('All current JS updates done.');
                cb && cb();
            }
        });
    }
    
    function minify(cb) {
        console.log('Minifying ' + srcFilename);
        closureCompile(srcDir + srcFilename, destDir, destFilename).then(function () {
            cb && cb();
        });
    }
    
    var lazybuild = lazypipe().pipe(source, srcFilename).pipe(buffer).pipe($.sourcemaps.init.bind($.sourcemaps));
    
    var lazywrite = lazypipe().// pipe($.sourcemaps.write.bind($.sourcemaps), './').
    pipe(gulp.dest.bind(gulp), destDir);
    
    if (options.closureCompile) {
        minify(cb);
    } else {
        rebundle(cb);
    }
}

gulp.task('reload', function (cb) {
    touch('dist/update', {force: true}, cb);
});

gulp.task('compile-dev', function (cb) {
    compileJs({watch: true}, cb);
});

gulp.task('compile-bundle', function (cb) {
    compileJs({closureCompile: true}, cb);
});


gulp.task('default', function (callback) {
    runSequence('clean:before',
            ['compile-dev', 'lib-dev', 'templates-dev', 'css-dev'],
            ['revision', 'static'],
            ['process-html-dev'],
            'clean:after',
            ['watch-templates', 'watch-css', 'serve'],
            callback);
});

gulp.task('watch-templates', function () {
    return templates.watchTemplates();
});

gulp.task('watch-css', function () {
    return templates.watchStyles();
});

gulp.task('templates-dev', function () {
    return templates.buildTemplates({});
});

gulp.task('templates-bundle', function () {
    return templates.buildTemplates({
        compile: true
    });
});

gulp.task('css-bundle', function () {
    var nano = require('gulp-cssnano');
    
    return gulp.src([
                'src/**/reset.css',
                'src/**/base.css',
                'src/**/*.css',
                'lib/bootstrap/dist/css/bootstrap.min.css',
                'lib/bootstrap/dist/css/bootstrap-theme.min.css',
            ]
    ).pipe($.sourcemaps.init()).pipe($.concat('style.css')).pipe(nano()).pipe($.sourcemaps.write('./')).pipe(gulp.dest('./dist'));
});

gulp.task('bundle', function (callback) {
    runSequence('clean:before',
            ['compile-bundle', 'lib-bundle', 'templates-bundle', 'css-bundle'],
            ['revision', 'static'],
            'process-html-bundle',
            'clean:after',
            callback);
});

gulp.task('bundle-prod', function (callback) {
    runSequence('clean:before',
            ['compile-bundle', 'lib-bundle', 'templates-bundle', 'css-bundle'],
            'concat',
            ['revision', 'static'],
            'process-html-bundle-prod',
            'clean:after',
            'clean:after-prod',
            callback);
});

gulp.task('concat', function () {
    return gulp.src(['dist/lib.min.js', 'dist/script.js', 'dist/templates.js']).pipe($.concat('script.js')).pipe(gulp.dest('dist'));
});

gulp.task('clean:before', function () {
    $.filenames.forget('all');
    
    return del(['dist/*']);
});

gulp.task('clean:watch', function () {
    $.filenames.forget('all');
    
    return del(['dist/script*', '!dist/index.html']);
});


gulp.task('clean:after', function () {
    return del(['rev-manifest.json']);
});

gulp.task('clean:after-prod', function () {
    return del(['dist/lib.min.js', 'dist/templates.js']);
});

gulp.task('revision', function () {
    return gulp.src(['dist/script.js', 'dist/style.css']).pipe($.rev()).pipe(gulp.dest('dist')).pipe($.revNapkin()).pipe($.rev.manifest()).pipe(gulp.dest(''));
});

gulp.task('static', function () {
    return gulp.src('static/**/*').pipe(gulp.dest('dist/static'));
});


gulp.task('get-css', function () {
    return gulp.src([
                'src/**/reset.css',
                'src/**/base.css',
                'src/**/*.css',
                'lib/bootstrap/dist/css/bootstrap.min.css',
                'lib/bootstrap/dist/css/bootstrap-theme.min.css',
            ]
    ).pipe($.filenames('css'));
});

function processHtmlBundle(isProd) {
    var manifest = gulp.src('./rev-manifest.json');
    
    var scripts = ['/lib.min.js', '/script.js', '/templates.js'];
    if (isProd) scripts = ['/script.js'];
    
    return gulp.src('src/index.html').pipe($.htmlReplace({
        styles: ['/style.css'],
        scripts: scripts
    })).pipe(gulp.dest('dist')).pipe($.revReplace({manifest: manifest})).pipe($.htmlmin({collapseWhitespace: true})).pipe(gulp.dest('dist'));
}

gulp.task('process-html-bundle', function () {
    return processHtmlBundle();
});

gulp.task('process-html-bundle-prod', function () {
    return processHtmlBundle(true);
});

gulp.task('process-html-dev', ['get-css'], function () {
    var manifest = gulp.src('./rev-manifest.json');
    var css = $.filenames.get('css').map(function (filename) {
        return '/' + filename;
    });
    
    return gulp.src('src/index.html').pipe($.htmlReplace({
        styles: css,
        scripts: ['/lib.js', '/script.js']
    })).pipe(gulp.dest('dist')).pipe($.revReplace({manifest: manifest})).pipe($.htmlmin({collapseWhitespace: false})).pipe(gulp.dest('dist'));
});

gulp.task('css-dev', function () {
    return gulp.src([
        'src/**/*.css',
        'lib/bootstrap/dist/css/bootstrap.min.css',
        'lib/bootstrap/dist/css/bootstrap-theme.min.css'
    ]).pipe($.changed('dist')).pipe(gulp.dest('dist'));
});

gulp.task('lib-dev', function () {
    var bowerMain = require('bower-main'),
            bowerMainJavaScriptFiles = bowerMain('js', 'min.js', '');
    
    return gulp.src(bowerMainJavaScriptFiles.normal).pipe($.concat('lib.js')).pipe(gulp.dest('dist'));
});

gulp.task('lib-bundle', function () {
    var bowerMain = require('bower-main'),
            bowerMainJavaScriptFiles = bowerMain('js', 'min.js');
    
    return merge2(
            gulp.src(bowerMainJavaScriptFiles.minified),
            gulp.src(bowerMainJavaScriptFiles.minifiedNotFound).pipe($.concat('tmp.min.js')).pipe($.uglify())
    ).pipe($.concat('lib.min.js')).pipe(gulp.dest('dist'));
});

gulp.task('serve', function () {
    return gulp.src('dist').pipe($.serverLivereload({
        port: 1980,
        fallback: 'index.html',
        livereload: {
            enable: true,
            filter: function (filePath, cb) {
                cb(/dist\/update|css$/.test(filePath));
            }
        }
        // open: true
    }));
});

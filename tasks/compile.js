var fs = require('fs-extra');

var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var queue = [];
var inProgress = 0;
var MAX_PARALLEL_CLOSURE_INVOCATIONS = 4;

var env = process.env.APP_ENV || 'development';

/**
 * @param {string} entryModuleFilename Entrypoint.
 * @param {string} outputDir Output directory.
 * @param {string} outputFilename Output filename.
 *
 * @return {Promise} Compilation promise.
 */
exports.closureCompile = function(entryModuleFilename, outputDir, outputFilename) {
    // Rate limit closure compilation to MAX_PARALLEL_CLOSURE_INVOCATIONS
    // concurrent processes.
    return new Promise(function(resolve) {
        function start() {
            inProgress++;
            compile(entryModuleFilename, outputDir, outputFilename).then(function() {
                inProgress--;
                next();
                resolve();
            }, function(e) {
                console.error('Compilation error', e.message, 'bok ye', e.stack);
                process.exit(1);
            });
        }

        function next() {
            if (!queue.length) {
                return;
            }
            if (inProgress < MAX_PARALLEL_CLOSURE_INVOCATIONS) {
                queue.shift()();
            }
        }

        queue.push(start);
        next();
    });
};

function compile(entryModuleFilename, outputDir, outputFilename) {
    var closureCompiler = require('google-closure-compiler').gulp();

    return new Promise(function(resolve, reject) {
        var intermediateFilename = 'build/cc/' + entryModuleFilename.replace(/\//g, '_').replace(/^\./, '');

        console.log('Starting closure compiler for ', entryModuleFilename);
        fs.mkdirsSync('build/cc');

        var wrapper = '(function(){%output%})();';

        if (fs.existsSync(intermediateFilename))
            fs.unlinkSync(intermediateFilename);

        var srcs = [
            'lib/goog.js',
            'src/**/*.js',
            '!**_test.js',
            '!**/test-*.js'
        ];

        var externs = [
            'lib/externs/lib/angular.js', 'lib/externs/lib/angular-1.5-q_templated.js',
            'lib/externs/lib/angular_ui_router.js', 'lib/externs/lib/angular-1.5-http-promise_templated.js',
            'lib/externs/common.js', 'lib/externs/jquery-1.9.js'
        ];

        return gulp.src(srcs).
            pipe(sourcemaps.init()).
            pipe(closureCompiler({
                compilation_level: 'ADVANCED_OPTIMIZATIONS',
                warning_level: 'VERBOSE',
                language_in: 'ECMASCRIPT6_TYPED',
                assume_function_wrapper: true,
                language_out: 'ECMASCRIPT5_STRICT',
                output_module_dependencies: 'dependencies.json',
                // preserve_type_annotations: true,
                summary_detail_level: 3,
                // new_type_inf: true,
                // tracer_mode: 'ALL',
                use_types_for_optimization: true,
                define: 'env$$module$config$index="' + env + '"',
                output_wrapper: wrapper,
                externs: externs,
                dependency_mode: 'STRICT',
                process_common_js_modules: true,
                formatting: ['PRETTY_PRINT'/*, 'PRINT_INPUT_DELIMITER'*/],
                js_module_root: '/src',
                jscomp_error: '*',
                jscomp_warning: ['lintChecks'],
                jscomp_off: ['extraRequire', 'inferredConstCheck'],
                hide_warnings_for: '[synthetic',
                entry_point: 'index',
                generate_exports: true,
                export_local_property_definitions: true,
                angular_pass: true,
                // output_manifest: 'manifest.txt',
                // variable_renaming_report: 'variable_map.txt',
                // property_renaming_report: 'property_map.txt',
                js_output_file: 'script.js'
            })).
            on('error', function(err) {
                console.error(err);
                process.exit(1);
            }).
            pipe(sourcemaps.write('/')).
            pipe(gulp.dest(outputDir)).
            on('end', function() {
                console.log('Compiled ', entryModuleFilename, 'to', outputDir + '/' + outputFilename, 'via',
                    intermediateFilename);
                resolve();
            });
    });
}

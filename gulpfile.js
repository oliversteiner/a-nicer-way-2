// require
const {src, dest, watch, series, parallel} = require('gulp');


const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const nano = require('gulp-cssnano');
const ts = require("gulp-typescript");
const merge = require('merge2');
const inject = require('gulp-inject');


// SASS
const input_sass = 'src/sass/**/*.scss';
const output_sass = 'web/css/';

const sassOptions = {
    errLogToConsole: true
    // outputStyle: 'expanded'
};


// Typescript
const input_ts = 'src/ts/**/*.ts';
const output_ts = 'web/js';
const output_tsd = 'web/definitions';

const tsProject = ts.createProject("tsconfig.json");

function scripts() {
    const tsResult = src(input_ts)
        .pipe(sourcemaps.init()) // This means sourcemaps will be generated 
        .pipe(tsProject());

    return merge([ // Merge the two output streams, so this task is finished when the IO of both operations is done.
        tsResult.dts.pipe(dest(output_tsd)),
        tsResult.js.pipe(dest(output_ts))
    ]);
};


// CSS
function styles() {
    return src(input_sass)
    //  .pipe(debug({title: 'nw-css:'}))
        .pipe(sourcemaps.init())
        .pipe(sass(sassOptions).on('error', sass.logError))
        .pipe(nano())
        .pipe(sourcemaps.write('./maps'))
        .pipe(dest(output_sass));
};


// HTML

const src_html = './src/html/**/*.html';
const html_views = './src/html/views/**/*.html';
const html_panels = './src/html/panels/**/*.html';
const source_html = './src/html/index.html';
const output_html = './web';
const input_js_includes = ['!web/js/remote.js', 'web/js/**/*.js'];  // anyting exepted "remote.js"


function html() {

    // MAIN
    return src(source_html)
    // Views
        .pipe(inject(
            src([html_views]), {
                starttag: '<!-- inject:{{path}} -->',
                relative: true,
                transform: function (filePath, file) {
                    // return file contents as string
                    return file.contents.toString('utf8')
                }
            }))
        // Panels
        .pipe(inject(
            src([html_panels]), {
                starttag: '<!-- inject-panel:{{path}} -->',
                relative: true,
                transform: function (filePath, file) {
                    // return file contents as string
                    return file.contents.toString('utf8')
                }
            }))
        // JS includes
        .pipe(inject(
            src(input_js_includes, {read: false}),
            {ignorePath: 'web/', addRootSlash: false})
        )
        .pipe(dest(output_html));


}

function html_remote() {
    // REMOTE

    return src('./src/html/remote.html')
        .pipe(inject(src([html_views]), {
            starttag: '<!-- inject:{{path}} -->',
            relative: true,
            transform: function (filePath, file) {
                // return file contents as string
                return file.contents.toString('utf8')
            }
        }))
        .pipe(dest('./web'));
}


// Watch task

function watch_style() {
    watch(input_sass, styles);
}

function watch_scripts() {
    watch(input_ts, scripts);
}

function watch_html() {
    watch(src_html, html);
}

function watch_html_remote() {
    watch(src_html, html_remote);
}


// Export
 exports.build = parallel(watch_style, watch_scripts, watch_html, watch_html_remote);
'use static'

const gulp = require('gulp');
const less = require('gulp-less');
const babel = require('gulp-babel');
// const concat = require('gulp-concat'); // Most of the time, you can't neet concat
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const cleanCSS = require('gulp-clean-css');
const del = require('del');
const autoprefixer = require('autoprefixer')
const sourcemaps = require('gulp-sourcemaps');
const imagemin = require('gulp-imagemin');
const cache = require('gulp-cache');
const browserSync = require('browser-sync').create();
const postcss = require('gulp-postcss');
const pxtoviewport = require('postcss-px-to-viewport');

const sass = require('gulp-sass');
sass.compiler = require('node-sass');

const paths = {
    html: {
        src: 'src/**/*.html'
    },
    css: {
        src: 'src/styles/**/*.css',
        dest: 'src/styles/',
        build: 'assets/styles/'
    },
    less: {
        src: 'src/styles/**/*.less',
        dest: 'src/styles/'
    },
    sass: {
        src: 'src/styles/**/*.scss',
        dest: 'src/styles/'
    },
    scripts: {
        src: 'src/scripts/**/*.js',
        dest: 'src/scripts/',
        build: 'assets/scripts/'
    },
    images: {
        src: 'src/images/**/*.{jpg,jpeg,png}',
        build: 'assets/images/'
    },
    public: {
        src: 'src/public/**/*',
        build: 'assets/public/'
    }
}

const processors = [
    pxtoviewport({
        viewportWidth: 750,
        viewportHeight: 1334,
        unitPrecision: 8,
        minPixelValue: 1,
        viewportUnit: 'vw'
    })
];


async function clean() {
    const deletedPaths = await del(['assets/**/*', '!assets/images', '!assets/images/**/*']);
    return deletedPaths;
}

function cssTask() {
    return gulp.src(paths.css.src)
        .pipe(postcss(processors))
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest(paths.css.dest));
}

function lessTask() {
    return gulp.src(paths.less.src)
        .pipe(less())
        .pipe(postcss(processors))
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest(paths.less.dest));
}

function sassTask() {
    return gulp.src(paths.sass.src)
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss(processors))
        .pipe(postcss([autoprefixer()]))
        .pipe(sourcemaps.write('.'))
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest(paths.sass.dest));
}

/**
 * build html
 */
function buildHtml() {
    return gulp.src(paths.html.src)
        .pipe(gulp.dest('assets'));
}

/**
 * build css
 */
function bulidStyles() {
    return gulp.src(paths.css.src)
        .pipe(cleanCSS())
        .pipe(gulp.dest(paths.css.build));
}

/**
 * build scripts
 */
function buildScripts() {
    return gulp.src(paths.scripts.src, {
            sourcemaps: true
        })
        .pipe(babel())
        .pipe(uglify())
        // Most of the time, you don't neet concat
        // .pipe(concat('main.min.js'))
        .pipe(gulp.dest(paths.scripts.build));
}

/**
 * build public
 */
function buildPublic() {
    return gulp.src(paths.public.src)
        .pipe(gulp.dest(paths.public.build));
}

/**
 * Compressed pictures
 */
function buildImages() {
    return gulp.src(paths.images.src)
        .pipe(cache(imagemin([
            imagemin.gifsicle({
                interlaced: true
            }),
            imagemin.jpegtran({
                progressive: true
            }),
            imagemin.optipng({
                optimizationLevel: 5
            }),
            imagemin.svgo({
                plugins: [{
                        removeViewBox: true
                    },
                    {
                        cleanupIDs: false
                    }
                ]
            })
        ])))
        .pipe(gulp.dest(paths.images.build));
}

/**
 * firsttime run serve, maybe you need to compile sass & less
 */
function compile() {
    sassTask();
    lessTask();
}

/**
 * watchFiles
 */
function watchFiles() {
    gulp.watch(paths.less.src, lessTask);
    gulp.watch(paths.sass.src, sassTask);
}

/**
 * hot reload
 */
async function gulpServe() {
    compile();
    watchFiles();
    await browserSync.init({
        server: {
            baseDir: './src',
        },
        files: [paths.html.src, paths.css.src, paths.scripts.src, paths.images.src]
    })
}

const serve = gulp.series(gulpServe);
const build = gulp.series(clean, gulp.parallel(buildHtml, bulidStyles, buildScripts, buildPublic, buildImages));

exports.clean = clean;
exports.watch = watchFiles;
exports.build = build;

exports.default = serve;
const { dest, series, src, watch } = require('gulp');
const autoprefixer = require('gulp-autoprefixer');
const browserSync = require('browser-sync').create();
const cssnano = require('gulp-cssnano');
const fileinclude = require('gulp-file-include');
const imagemin = require('gulp-imagemin');
const prettyHtml = require('gulp-pretty-html');
const pug = require('gulp-pug');
const sass = require('gulp-sass')(require('sass'));
const sourcemaps = require('gulp-sourcemaps');
const webpack = require('webpack-stream');

const paths = {
	src: {
		pug: './src/templates/*.pug',
		pugPartials: './src/templates/partials/*.pug',
		html: './src/html/*.html',
		htmlPartials: './src/html/partials/*.html',
		sass: './src/assets/sass/**/*.scss',
		fonts: './src/assets/fonts/*',
		img: './src/assets/img/*',
		js: './src/assets/js/**/*.js',
	},
	dist: {
		html: './dist',
		css: './dist/assets/css',
		fonts: './dist/assets/fonts',
		img: './dist/assets/img',
		js: './dist/assets/js',
	},
};

function compilePUG(cb) {
	src(paths.src.pug)
		.pipe(pug({ pretty: true }))
		.pipe(prettyHtml())
		.pipe(dest(paths.dist.html));
	cb();
}

function compileHTML(cb) {
	src(paths.src.html)
		.pipe(fileinclude({ prefix: '@@', basepath: '@file' }))
		.pipe(prettyHtml())
		.pipe(dest(paths.dist.html));
	cb();
}

function compileSASS(cb) {
	src(paths.src.sass)
		.pipe(sourcemaps.init())
		.pipe(sass().on('error', sass.logError))
		.pipe(autoprefixer())
		.pipe(cssnano())
		.pipe(sourcemaps.write())
		.pipe(dest(paths.dist.css));
	cb();
}

function copyFonts(cb) {
	src(paths.src.fonts).pipe(dest(paths.dist.fonts));
	cb();
}

function compileJS(cb) {
	src(paths.src.js)
		.pipe(
			webpack({
				mode: 'production',
				output: { filename: 'main.js' },
				module: {
					rules: [
						{
							test: /\.m?js$/,
							exclude: /(node_modules|bower_components)/,
							use: {
								loader: 'babel-loader',
								options: { presets: [['@babel/preset-env', { corejs: 3, useBuiltIns: 'usage' }]] },
							},
						},
					],
				},
			})
		)
		.pipe(dest(paths.dist.js));
	cb();
}

function minifyImages(cb) {
	src(paths.src.img).pipe(imagemin()).pipe(dest(paths.dist.img));
	cb();
}

function browserSyncServe(cb) {
	browserSync.init({ server: { baseDir: paths.dist.html } });
	cb();
}

function browserSyncReload(cb) {
	browserSync.reload();
	cb();
}

function watchers() {
	watch([paths.src.pug, paths.src.pugPartials], series(compilePUG, browserSyncReload));
	watch([paths.src.html, paths.src.htmlPartials], series(compileHTML, browserSyncReload));
	watch(paths.src.sass, series(compileSASS, browserSyncReload));
	watch(paths.src.fonts, series(copyFonts, browserSyncReload));
	watch(paths.src.js, series(compileJS, browserSyncReload));
	watch(paths.src.img, series(minifyImages, browserSyncReload));
}

exports.pug = series(compilePUG, compileSASS, copyFonts, compileJS, minifyImages, browserSyncServe, watchers);
exports.default = series(compileHTML, compileSASS, copyFonts, compileJS, minifyImages, browserSyncServe, watchers);

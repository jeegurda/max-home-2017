'use strict';

var modes = {
    LIST: 0,
    PROJECT: 1
};
var mode = modes.LIST;

var load = function() {

    var about = document.querySelector('.ui-about');
    var aboutHide = document.querySelector('.ui-about-hide');
    var star = document.querySelector('.ui-star');
    var back = document.querySelector('.ui-back');

    var list = document.querySelector('.list');
    var project = document.querySelector('.project');
    var projectContent = document.querySelector('.project-content');
    var projectNext = document.querySelector('.project-next');
    var nextLink = document.querySelector('.project-next-link');
    var loading = document.querySelector('.loading');
    var loadingIndicator = document.querySelector('.loading-indicator');
    var loadingProgress = document.querySelector('.loading-progress');
    var mobileNote = document.querySelector('.mobile-note');

    var body = document.body;
    var html = document.documentElement;

    var showAll = false;
    var projectsMeta = [];
    var projects = []; // DOM elements
    var curId = null;

    var mobile = function() {
        return html.clientWidth < 1024;
    };

    var renderList = function() {
        var fadingItems = [];

        var offsetImage = function(offset) {
            mobileNote.style.marginBottom = -offset + 'px';
        };

        projectsMeta.forEach(function(el, i) {

            var item = document.createElement('a');
            item.classList.add('list-item');
            if (i < 6) {
                item.classList.add('fading');
                item.classList.add(`fading-delay-${i}`);
                fadingItems.push(item);
            }
            item.href = '#' + el.id;
            if (projectsMeta.slice(0, i).map(function(el) {
                return el.id;
            }).indexOf(el.id) !== -1) {
                console.warn('dublicate id', el.id, 'found in', el);
            }

            var image = document.createElement('div');
            image.classList.add('list-image');

            if (i === 5) {
                image.addEventListener('animationend', function() {
                    fadingItems.forEach(function(el) {
                        el.classList.remove('fading');
                    });
                });
            }

            var img = document.createElement('img');
            img.src = el.thumbnail || '';

            if (i === 0) {
                if (img.complete && img.clientHeight > 0) {
                    offsetImage(img.clientHeight / 2);
                } else {
                    img.addEventListener('load', function() {
                        offsetImage(img.clientHeight / 2);
                    });
                }
            }

            image.appendChild(img);

            var description = document.createElement('div');
            description.classList.add('list-description');

            var tagline = document.createElement('em');
            tagline.classList.add('list-tagline');
            tagline.innerHTML = el.tagline || '';

            var title = document.createElement('h3');
            title.classList.add('list-title');
            title.innerHTML = el.title || '';

            var caption = document.createElement('p');
            caption.classList.add('list-caption');
            caption.innerHTML = el.caption || '';

            description.appendChild(tagline);
            description.appendChild(title);
            description.appendChild(caption);

            item.appendChild(image);
            item.appendChild(description);
            list.appendChild(item);

            projects.push(item);
        });
    };

    var getProjectHtml = function(url) {
        return new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();

            xhr.open('GET', url);

            xhr.addEventListener('readystatechange', function() {
                if (xhr.readyState === 4) {
                    if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) {
                        resolve(xhr.responseText);
                    } else {
                        reject(xhr.status);
                    }
                }
            });
            xhr.send();
        });
    };

    var loadHtml = function(html) {
        return new Promise(function(resolve, reject) {
            projectContent.innerHTML = html;
            var images = projectContent.querySelectorAll('img');
            var parts = images.length;
            var loadedParts = 0;

            var updateProgress = function() {
                loadedParts++;
                var progress = loadedParts / parts;

                loadingIndicator.style.height = progress * 100 + '%';
                loadingProgress.innerHTML = (progress * 100).toFixed(0);

                if (progress === 1) {
                    resolve();
                }
            };

            Array.prototype.forEach.call(images, function(img) {
                if (img.complete) {
                    updateProgress();
                } else {
                    img.addEventListener('load', function() {
                        updateProgress();
                    });
                    img.addEventListener('error', function() {
                        updateProgress();
                    });
                }
            });

            loading.classList.add('progress');
        });
    };

    var setNextLinkURL = function(info) {
        var nextProjectMeta = projectsMeta[info.index + 1];
        nextLink.href = `#${nextProjectMeta ? nextProjectMeta.id : projectsMeta[0].id}`;
        nextLink.innerHTML = info.meta.title;
    };

    var resetHash = function() {
        location.hash = 'index';
    };

    var loadProject = function(id) {
        var info = {
            meta: null,
            index: null
        };

        console.log(`loading ${id}...`);

        if (id === curId) {
            console.log(`project with id ${id} is already open`);
            return;
        }

        setScrollPosition(); // for all those hash resets

        if (mobile()) {
            console.log('not loading on mobile yet');
            resetHash();
            return;
        }

        projectsMeta.some(function(el, i) {
            if (el.id === id) {
                info.meta = el;
                info.index = i;
                return true;
            }
        });

        if (info.index === null) {
            console.warn(`id ${id} wasn't found in the JSON`);
            resetHash();
            return;
        }

        curId = id;

        getProjectHtml(info.meta.index).then(function(html) {
            loading.classList.add('progress');
            return loadHtml(html);
        }, function(status) {
            return Promise.reject(status);
        }).then(function() {

            setNextLinkURL(info);

            setTimeout(function() {
                body.classList.add('project-active');
                setScrollPosition();
                mode = modes.PROJECT;

                loadingIndicator.style.height = 0;
                loading.classList.add('done');
                window.scrollTo(0, 0);
                setTimeout(function() {
                    loading.classList.remove('done');
                    loading.classList.remove('progress');
                }, 300); // time for the transition to the top
            }, 400); // time for the last transition to 100%

        }).catch(function(err) {
            if (typeof err === 'number') {
                console.warn('failed with status %s', err);
            } else {
                console.warn('something else');
            }
        });
    };

    var addMouseEvents = function() {
        projects.forEach(function(el) {
            el.addEventListener('mouseenter', function() {
                if (mobile()) {
                    return;
                }

                var img = this.querySelector('.list-image img');

                if (!img) {
                    console.warn('No image was found inside item', this);
                    return;
                }

                if (this.clientWidth / this.clientHeight > img.clientWidth / img.clientHeight) {
                    img.style.transform = 'scale(' + (1 + (this.clientWidth - img.clientWidth) / img.clientWidth) + ')';
                } else {
                    img.style.transform = 'scale(' + (1 + (this.clientHeight - img.clientHeight) / img.clientHeight) + ')';
                }
            });

            el.addEventListener('mouseleave', function() {
                if (mobile()) {
                    return;
                }

                var img = this.querySelector('.list-image img');

                img.style.transform = 'none';
            });
        });
    };

    var getProjects = function() {
        return new Promise(function(resolve) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', './projects/index.json');

            xhr.addEventListener('readystatechange', function() {
                if (xhr.readyState === 4) {
                    try {
                        projectsMeta = JSON.parse(xhr.responseText);
                    } catch(e) {
                        console.warn('Failed to parse the response:', e);
                        projectsMeta = [];
                    }

                    resolve();
                }
            });
            xhr.send();
        });
    };

    var scrollPositions = {
        list: null,
        project: null
    };

    var setScrollPosition = function() {
        if (mode === modes.LIST) {
            console.warn('set list pos');
            scrollPositions.list = window.scrollY;
        } else if (mode === modes.PROJECT) {
            console.warn('set project pos');
            scrollPositions.project = window.scrollY;
        }
    };

    var restoreScrollPosition = function() {
        if (mode === modes.LIST && scrollPositions.list !== null) {
            console.warn('restored list pos');
            window.scrollTo(0, scrollPositions.list);
        } else if (mode === modes.PROJECT && scrollPositions.project !== null) {
            console.warn('restored project pos');
            window.scrollTo(0, scrollPositions.project);
        }
    };

    var addUIEvents = function() {
        about.addEventListener('click', function() {
            setScrollPosition();
            body.classList.add('about-active');
        });

        aboutHide.addEventListener('click', function() {
            body.classList.remove('about-active');
            restoreScrollPosition();
        });

        // smooth scroll

        // easing function: thanks http://gizma.com/easing/
        // (time, starting value, change in value, duration)
        var easeInOutQuad = function (t, b, c, d) {
            t /= d / 2;
            if (t < 1) return c / 2 * t * t + b;
            t--;
            return -c / 2 * (t * (t - 2) - 1) + b;
        };

        var currentTime = 0;
        var scrollInProgress = false;

        // duration - how many times scroll function should be called
        var smoothScroll = function(to, duration) {
            return new Promise(function(resolve) {
                var from = window.scrollY;

                var change = to - from;
                var currentTime = 0;

                var smoothScrollStep = function() {
                    var val = easeInOutQuad(currentTime, from, change, duration);
                    window.scrollTo(0, val);
                    if (currentTime < duration) {
                        currentTime++;
                        requestAnimationFrame(smoothScrollStep);
                    } else {
                        scrollInProgress = false;
                        resolve();
                    }
                };

                smoothScrollStep();
            });
        };

        star.addEventListener('click', function() {
            if (scrollInProgress) {
                return;
            }

            scrollInProgress = true;
            var star = this;

            if (showAll === false) {
                star.classList.add('inactive');
                body.classList.add('show-all');
                showAll = true;
                smoothScroll(html.clientHeight / 4, 20);
            } else {
                star.classList.remove('inactive');
                smoothScroll(0, 20).then(function() {
                    body.classList.remove('show-all');
                    showAll = false;
                });
            }
        });

    };

    var addScrollEvents = function() {

        var setOpacity = function() {
            projects.some(function(el, i) {
                if (el.offsetTop > window.scrollY) {
                    if (i < projects.length) el.style.opacity = 1;
                    if (i + 1 < projects.length) projects[i + 1].style.opacity = 1;
                    if (i + 2 < projects.length) projects[i + 2].style.opacity = 1;

                    if (i >= 3) {
                        var opacityPast = 1 + projects[i - 3].getBoundingClientRect().top / (el.clientHeight * 0.8);
                        if (opacityPast < 0) {
                            opacityPast = 0;
                        }

                        projects[i - 1].style.opacity = opacityPast;
                        projects[i - 2].style.opacity = opacityPast;
                        projects[i - 3].style.opacity = opacityPast;
                    }

                    return true;
                }
            });
        };

        var setProjectNextState = function() {
            if (window.scrollY + html.clientHeight + 100 >= project.scrollHeight) {
                projectNext.classList.add('active');
            } else {
                projectNext.classList.remove('active');
            }
        };

        window.addEventListener('scroll', function() {
            if (mobile()) {
                return;
            }

            if (mode === modes.LIST) {
                setOpacity();
            } else if (mode === modes.PROJECT) {
                setProjectNextState();
            }
        });
    };

    var addNavigationEvents = function() {
        var handleHash = function() {
            if (location.hash) {
                if (location.hash === '#index') {
                    projectContent.innerHTML = null;
                    body.classList.remove('project-active');
                    mode = modes.LIST;
                    setTimeout(restoreScrollPosition, 0);
                    curId = null;
                } else {
                    loadProject(location.hash.substr(1));
                }
            } else {
                resetHash();
            }
        }

        window.onpopstate = function() {
            handleHash();
        };

        handleHash();
    };


    getProjects().then(function() {
        renderList();
        addMouseEvents();
        addScrollEvents();
        addNavigationEvents();
    });
    addUIEvents();

};

document.addEventListener('DOMContentLoaded', load);

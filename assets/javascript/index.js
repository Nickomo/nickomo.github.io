'use strict'

class JokesAPI {
    // Returns request result from API
    static async getJokes(url, data = null) {
        return $.ajax({
            type: 'GET',
            url: 'https://api.chucknorris.io/jokes/' + url,
            data: data
        });
    }

    // Returns a random joke
    static async getRandomJoke() {
        return this.getJokes('random');
    }

    // Returns a list of available categories.
    static async getJokesCategories() {
        return this.getJokes('categories');
    }

    // Returns a random joke from a given category.
    static async getJokeFromCategory(category) {
        console.log(category);
        return this.getJokes('random', {category});
    }

    // Returns jokes that match the search string
    static async getJokesFromSearch(query) {
        return this.getJokes('search', {query});
    }
}


class FavoriteJokes {
    // Returns array with favorite jokes
    static getFavoriteJokes() {
        let jokes = [];
        for (const key in localStorage) {
            if(localStorage.hasOwnProperty(key))
                jokes.push(JSON.parse(localStorage.getItem(key)));
        }
        return jokes;
    }
    // Returns true if the joke is in favorites, otherwise false
    static isJokeExists(id) {
        if(localStorage.getItem(id) !== null)
            return true;
        return false;
    }

    // Adds joke to favorite jokes
    static addJokeToFavorite(obj) {
        localStorage.setItem(obj.id, JSON.stringify(obj));
    }

    // Removes joke from favorite jokes
    static removeJokeFromFavorite(id) {
        localStorage.removeItem(id);
    }
}


$(document).ready(async () => {
    // Fills categories list
    let result = await JokesAPI.getJokesCategories();
    for (const item of result) {
        $('<div>', {
            class: 'category-element',
            text: item
        }).appendTo('#dropdown-joke-categories');
    }

    // This function inserts joke to container
    async function insertJoke(joke, appendTo) {
        let elementCategoryClass = joke.categories[0] === undefined ?' hidden' :'';
        let heartType = 'assets/images/' +
            (FavoriteJokes.isJokeExists(joke.id) ? 'heart-full.svg' :'heart.svg');
        let messageClass = ' ';
        let elementClass = ' ';

        if(appendTo == '.favorite-jokes-container') {
            messageClass += 'element-message-favorite';
            elementClass += 'favorite-jokes-element';
            elementCategoryClass = ' hidden';
        }

        $('<div>', {
            class: 'jokes-container-element' + elementClass,
            append: $('<img>', {
                class: 'element-heart',
                src: heartType
            })
            .add('<div>', {
                class: 'element-message' + messageClass,
                append: $('<img>', {
                    src: 'assets/images/message.svg'
                })
            })
            .add('<div>', {
                class: 'element-id',
                append: $('<span>', {
                    text: 'ID:'
                })
                .add('<a>', {
                    href: joke.url,
                    text: joke.id,
                    append: $('<img>', {
                        class: 'element-link-square',
                        src: 'assets/images/square.svg'
                    })
                    .add('<img>', {
                        class: 'element-link-arrow',
                        src: 'assets/images/arrow.svg'
                    })
                })
            })
            .add('<div>', {
                class: 'element-text',
                text: joke.value,
            })
            .add('<div>', {
                class: 'element-footer',
                append: $('<div>', {
                    class: 'element-last-update',
                    text: `Last update: ${Math.round((Date.now() -  Date.parse(joke.updated_at)) / 3600000)} hours ago`
                })
                .add('<div>', {
                    class: 'element-category' + elementCategoryClass,
                    text: joke.categories[0]
                })
            })
        })
        .appendTo(appendTo);
    }

    // Fills jokes list with selected filter
    $('#get-jokes-form').submit(async (e) => {
        e.preventDefault();

        let request = new FormData(e.target);
        let jokes = await (() => {
            switch(request.get('search-type')) {
                case 'random':
                    return JokesAPI.getRandomJoke();
                case 'categories':
                    return JokesAPI.getJokeFromCategory($('.category-element-selected').text());
                case 'search':
                    return JokesAPI.getJokesFromSearch(request.get('search-text'));
            }
        })();

        $('.jokes-container').empty();

        if(jokes.total === undefined) {
            insertJoke(jokes, '.jokes-container');
        } else {
            let i = 0;
            for (const joke of jokes.result) {
                i++;
                if(i <= 100) insertJoke(joke, '.jokes-container');
            }
        }
    });

    // Show dropdown item under selected radio button
    $('input[type=radio]').click((e) => {
        let dropdowns = new Map([
            ['joke-categories', $('#dropdown-joke-categories')],
            ['search-joke', $('#dropdown-search-joke')]
        ]);

        let target = dropdowns.get(e.target.id);

        for (const elem of dropdowns.values()) {
            elem != target? elem.addClass('hidden'): elem.removeClass('hidden');
        }
    });


    // Category selection
    let prevSelected = $('.category-element').eq(0);
        prevSelected.addClass('category-element-selected');

    $('.category-element').click((e) => {
        if(prevSelected != null) {
            prevSelected.removeClass('category-element-selected')
        }
        prevSelected = $(e.target);
        prevSelected.addClass('category-element-selected');
    })


    // Shows side block
    $('.show-favorite-jokes').click((e) => {
        let modal = $('.modal-window-background');
        let button = $('.show-favorite-jokes');

        if(button.hasClass('show-jokes-active')) button.removeClass('show-jokes-active');
        else button.addClass('show-jokes-active');

        if(modal.hasClass('visible')) modal.removeClass('visible');
        else modal.addClass('visible');

        let sideBlock = $('.favorite-jokes');
        sideBlock.slideToggle("500");
        if(sideBlock.hasClass('open-side-menu')) sideBlock.removeClass('open-side-menu');
        else sideBlock.addClass('open-side-menu');
    })

    // Adds or removes joke to/from favorites
    $(document).on('click', '.element-heart', async (e) => {
        let heart = $(e.target);
        let text = $(e.target.parentElement).children('.element-text').text();
        let joke = await JokesAPI.getJokesFromSearch(text.substr(0, 120));

        if(heart.attr('src').includes('heart.svg')) {
            heart.attr({src: 'assets/images/heart-full.svg'});
            FavoriteJokes.addJokeToFavorite(joke.result[0]);
            insertJoke(joke.result[0], '.favorite-jokes-container');
        } else {
            heart.attr({src: 'assets/images/heart.svg'});
            FavoriteJokes.removeJokeFromFavorite(joke.result[0].id);
            showFavoriteJokes();
        }
    });

    // Fills favorite jokes
    function showFavoriteJokes() {
        let jokes = FavoriteJokes.getFavoriteJokes();
        $('.favorite-jokes-container').empty();
        for (const joke of jokes) {
            insertJoke(joke, '.favorite-jokes-container');
        }
    }
    showFavoriteJokes();

    // Changes styles when page has large width
    window.onresize = (e) => {
        if(e.target.innerWidth > 1140) {
            $('.modal-window-background').removeClass('visible');
            $('.favorite-jokes').removeClass('open-side-menu').attr('style', '');
            $('.show-favorite-jokes').removeClass('show-jokes-active');
        }
    }
});
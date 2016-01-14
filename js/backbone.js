/**
 * TODO: Delay before alert fade out so it looks better
 * TODO: Cache ajax requests
 * TODO: default $.ajax without error
 */

$(function() {

	/* App */
	var App = {
		Urls: {
			website: 'http://www.cloudspokes.com',
			api: 'http://api.cloudspokes.com/v1'
		},

		setPage: function(page) {
			if (!page)
				page = 'home';

			$('section').css('display', 'none');
			$('[page="'+page+'"]').css('display', 'block');

			var child = $('[page="'+page+'"]').index();

			$('header .nav > li').removeClass('active');
			$('header .nav > li:nth-child(' + (child > 4 ? 4 : child) + ')').addClass('active');
		},

		trimString: function(string, length) {
			if (string.length <= length)
				return string;

			var nextChar = string[length];
			string = string.substring(0, length);

			while (string[string.length - 1] != ' ' && nextChar != ' ')
				string = string.substring(0, string.length - 1);

			return (nextChar == ' ' ? string : string.substring(0, string.length - 1)) + '...';
		},

		formatNumber: function(number) {
			number = parseInt(number).toString();

			if (number.length > 3)
				number = number.substring(0, number.length - 3) + ',' + number.substring(number.length - 3, number.length);

			return number;
		}
	};

	/* Routing */
	var AppRouter = Backbone.Router.extend({
		routes: {
			'account/*page': 'accountRoute',
			'*page': 'normalRoute'
		},

		accountRoute: function(page) {
			App.setPage('account_' + page);
		},

		normalRoute: function(page) {
			App.setPage(page);
		}
	});

	/* Views */
	var PageView = Backbone.View.extend({
		initialize: function() {
			this.$el.html(this.templates.frame());
			this.setStatus('loading', 'Loading...');
			this.render();
		},

		setStatus: function(status, message) {
			this.status = status;

			if (status == 'loaded') {
				this.$('.alert').removeClass('in').animate({
					'height': 0,
					'border-top-width': 0,
					'border-bottom-width': 0,
					'padding-top': 0,
					'padding-bottom': 0,
					'margin-bottom': 0
				}, 200);

				this.$('.container').css('display', 'block');

			} else {
				this.$('.alert').html(message).addClass('in').animate({
					'height': 'initial',
					'border-width': '1px',
					'padding-top': '8px',
					'padding-bottom': '8px',
					'margin-bottom': '20px'
				}, 200);

				// TODO: Animate container h -> 0
				this.$('.container').empty().css('display', 'none');
			}
		},

		ajaxError: function(jqXHR, textStatus) {
			this.setStatus('error', 'Error while retrieving data from CloudSpokes: ' + textStatus + '<br />Please open the extension again.');
		}
	});

	var HomeView = PageView.extend({
		el: '[page="home"]',

		templates: {
			frame: _.template($('#home_template_frame').html()),
			container: _.template($('#home_template_container').html())
		},

		render: function() {
			var render = this;

			$.ajax({
				url: App.Urls.api + '/stats',

				success: function(statsData) {
					$.ajax({
						url: 'https://ajax.googleapis.com/ajax/services/feed/load',
						dataType: "jsonp",
						data: {
							q: 'http://feeds.feedburner.com/TheCloudSpokesBlog',
							num: 3,
							output: 'json',
							v: '1.0'
						},

						success: function (blogData) {
							render.$('.container').html(render.templates.container({
								stats: [
									App.formatNumber(statsData.response.members),
									App.formatNumber(statsData.response.competing_today),
									'$' + App.formatNumber(statsData.response.money_up_for_grabs),
									App.formatNumber(statsData.response.challenges_open)
								],

								posts: (function() {
									var posts = [];

									$.each(blogData.responseData.feed.entries, function(index, item) {
										posts[index] = {
											id: index,
											title: item.title,
											content: App.trimString(item.content, 200) + ' <a href="' + item.link + '" target="_blank">read more</a>'
										};
									});

									return posts;
								})()
							}));

							render.$('#collapse-0').addClass('in');
							render.$('#twitter').socialfeed({
								tw_limit: 5,
								tw_username:'cloudspokes'
							});

							render.setStatus('loaded');
						},

						error: render.ajaxError
					});
				},

				error: render.ajaxError
			});

			return render;
		}
	});

	var ChallengesView = PageView.extend({
		el: '[page="challenges"]',

		templates: {
			frame: _.template($('#challenges_template_frame').html()),
			container: _.template($('#challenges_template_container').html())
		},

		filters: {
			type: 'open',
			sort: 'asc',
			order_by: 'end_date',
			platform: null,
			technology: null,
			category: null,
			keyword: null
		},

		events: {
			'click .pagination li': 'paginationClick'
		},

		paginationClick: function(ev) {
			var index = $(ev.target).parent().index();

			switch(index) {
				case 0:
					return this.slider.prev();
				case (this.slider.sizes.length + 1):
					return this.slider.next();
			}

			this.slider.move(index-1);
		},

		getChallenge: function(response) {
			return response ? {
				id: response.challenge_id,
				name: App.trimString(response.name, 35),
				date: (moment(response.end_date).isAfter(moment()) ? 'ends ' : 'ended ') + moment(response.end_date).fromNow(),
				description: (function() {
					var temp = document.createElement('div');
					temp.innerHTML = response.description;
					return App.trimString($(temp).text(), 200);
				})(),
				prize: '$' + App.formatNumber(response.total_prize_money),
				members: (function() {
					var members = '';

					if (response.participating_members) {
						members += response.participating_members + ' ' + (response.participating_members == 1 ? 'member' : 'members') + ' participating';
						members += ', ' + response.registered_members + ' registered';
					} else
						members += response.registered_members + ' ' + (response.registered_members == 1 ? 'member' : 'members') + ' registered';

					return members;
				})(),
				type: response.challenge_type,
				typeClass: ''
			} : null;
		},

		showChallenges: function(challengesData) {
			var response = challengesData.response;
			var render = this;

			if (!response.length)
				render.setStatus('error', 'No challenges found.');

			else {
				if (render.filters.sort == 'desc')
					response = response.reverse();

				render.$('.container').html(render.templates.container({
					pages: (function() {
						var pages = [];

						for (var i = 0; i < response.length; i+=4)
							pages[pages.length] = [
								[
									render.getChallenge(response[i]),
									render.getChallenge(response[i+1])
								], [
									render.getChallenge(response[i+2]),
									render.getChallenge(response[i+3])
								]
							];

						return pages;
					})()
				}));

				render.slider = render.$('.slider').unslider({
					speed: 300,
					delay: 100000,
					complete: function() {
						render.$('.pagination li').removeClass('disabled');
						render.$('.pagination li:nth-child(' + (render.slider.current + 2) + ')').addClass('disabled');
					}
				}).data('unslider');

				render.slider.stop();
				render.$('.slider').css('width', '780px').css('height', '380px');
			}

			render.setStatus('loaded');
		},

		render: function() {
			var render = this;
			_.bindAll(this, 'showChallenges');

			if (render.filters.keyword)
				$.ajax({
					url: App.Urls.api + '/challenges/search',
					data: { keyword: render.filters.keyword },
					success: render.showChallenges,
					error: render.ajaxError,
				});

			else
				$.ajax({
					url: App.Urls.api + '/challenges' + (render.filters.type == 'open' ? '' : '/closed'),
					data: (function() {
						var data = {};

						$.each(render.filters, function(index, value) {
							if (value && index != 'type' && index != 'sort' && index != 'keyword')
								data[index] = value;
						});

						return data;
					})(),
					success: render.showChallenges,
					error: render.ajaxError,
				});

			return render;
		}
	});

	/* Load app */
	homeView = new HomeView();
	challengesView = new ChallengesView();

	/* Initialize routing */
	appRouter = new AppRouter();
	Backbone.history.start();

});
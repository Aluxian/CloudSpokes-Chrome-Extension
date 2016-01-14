/* Cloudspokes url */
var api_url = 'http://api.cloudspokes.com/v1';
var website_url = 'http://www.cloudspokes.com';

/* Filter default vars */
var filter_chl_open = true;
var filter_chl_order_by = 'end_date';
var filter_chl_order = 'asc';
var filter_chl_keyword = '';
var filter_chl_dd = false;
var filter_chl_dd_shown = false;
var filter_chl_platform = '';
var filter_chl_technology = '';
var filter_chl_category = '';

var filter_lb_period = 'all';
var filter_myc_type = 'active';
var filter_pay_type = 'outstanding';

/* Active page/data container */
var active_page, active_container;

var triedLogin = false;

/**
 * Main function
 */
function init() {
	/* Initial loading */
	loadHome();
	loadChallenges();
	loadLeaderboard();
	loadPayments();
	loadInbox();
	loadMyChallenges();
	switchPage('home');

	/* Listener for menu clicks */
	$('button.menuItem, .accountItem').click(function() {
		switchPage($(this).attr('page'));
	});

	/* Listener for challenge type filter */
	$("button[name='toggleChallengeType']").click(function() {
		if ($(this).attr('value') == 'true') {
			filter_chl_open = true;
			$('#orderBySelector, #toggleDropdown').css('display', 'block');
		} else {
			filter_chl_open = false;
			$('#orderBySelector, #toggleDropdown, .navigationRow:last-child').css('display', 'none');
			filter_chl_dd_shown = false;
		}

		loadChallenges();
	});

	/* Listener for order by filter */
	$("button[name='toggleChallengeOrderBy']").click(function() {
		filter_chl_order_by = $(this).attr('value');
		loadChallenges();
	});

	/* Listener for order filter */
	$("button[name='toggleChallengeOrder']").click(function() {
		filter_chl_order = $(this).attr('value');
		loadChallenges();
	});

	/* Listener for leaderboard period filter */
	$("button[name='toggleLeaderboardPeriod']").click(function() {
		filter_lb_period = $(this).attr('value');
		loadLeaderboard();
	});

	/* Listener for my challenges type filter */
	$("button[name='toggleMyChallengesType']").click(function() {
		filter_myc_type = $(this).attr('value');
		loadMyChallenges();
	});

	/* Listener for my payments type filter */
	$("button[name='togglePaymentsType']").click(function() {
		filter_pay_type = $(this).attr('value');
		loadPayments();
	});

	/* Listener for challenges keyword filter */
	$("input[name='challengeSearch']").keypress(function(e) {
		if (e.which == 13) {
			filter_chl_keyword = $(this).val();
			loadChallenges();
		}
	});

	/* Listener for dropdown bar shown toggle */
	$("#toggleDropdown").click(function() {
		if (filter_chl_dd_shown) {
			$('.navigationRow:last-child').css('display', 'none');
			filter_chl_dd_shown = false;
		} else {
			$('.navigationRow:last-child').css('display', 'inline-block');
			filter_chl_dd_shown = true;
		}
	});

	/* Listener for reset filters click */
	$("#resetFilters").click(function() {
		filter_chl_open = true;
		$('#orderBySelector, #toggleDropdown, input[name="challengeSearch"]').css('display', 'block');

		filter_chl_order_by = 'end_date';
		filter_chl_order = 'asc';

		filter_chl_keyword = '';
		$("input[name='challengeSearch']").val('');

		filter_chl_platform = '';
		$("#platformSelector > a").html('All Platforms <span class="caret"></span>');

		filter_chl_technology = '';
		$("#technologySelector > a").html('All Technologies <span class="caret"></span>');

		filter_chl_category = '';
		$("#categorySelector > a").html('All Categories <span class="caret"></span>');

		loadChallenges();
	});
}

/**
 * Load home page
 */
function loadHome() {
	displayAlert('show', false, 'home', 'Loading...');

	$.ajax({
		url: api_url + '/stats',
		success: function(data) {
			var formatNumber = function(number) {
				number = parseInt(number).toString();

				if (number.length > 3)
					number = number.substring(0, number.length - 3) + ',' + number.substring(number.length - 3, number.length);

				return number;
			};

			var stats = [
				formatNumber(data.response.members),
				formatNumber(data.response.competing_today),
				'$' + formatNumber(data.response.money_up_for_grabs),
				formatNumber(data.response.challenges_open)
			];

			$.each($('.statValue'), function(index, value) {
				$(this).text(stats[index]);
			});

			$.ajax({
				url: "https://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=6&output=json&q=" + encodeURIComponent('http://feeds.feedburner.com/TheCloudSpokesBlog'),
				dataType: "jsonp",
				success: function (data) {
					displayAlert('hide', true, 'home');
					var html = '';

					$.each(data.responseData.feed.entries, function (index, item) {
						html += '<div class="accordion-group"><div class="accordion-heading"><a class="accordion-toggle" data-toggle="collapse" data-parent="#twitter" href="#collapse' + index + '">' + item.title + '</a></div><div id="collapse' + index + '" class="accordion-body collapse"><div class="accordion-inner"><p>' + item.content + '</p><a class="read_more" href="' + item.link + '" target="_blank">Read More</a></div></div></div>';
					});

					$('#feed').html(html);
					$('#collapse0').addClass('in');
					$('#feed .accordion-inner').addClass('well');
					$('#feed .accordion-inner div').remove();
				}
			});

			 $('#twitter').socialfeed({
				tw_limit: 5,
				tw_username:'cloudspokes',
				cookies: true
			});

			$('div.title, #statsContainer').css('display', 'block');
		},
		error: function(jqXHR, textStatus) {
			displayAlert('show', true, 'home', 'Error while retrieving data from CloudSpokes: ' + textStatus + '<br />Please open the extension again.');
		},
	});
}

/**
 * Load challenges from the api
 */
function loadChallenges() {
	displayAlert('show', false, 'challenges', 'Loading...');

	// Search
	if (filter_chl_keyword != '') {
		$.ajax({
			url: api_url + '/challenges/search',
			data: { keyword: filter_chl_keyword },
			success: function(data) {
				displayAlert('hide', true, 'challenges');

				$.each(data, function(index, value) {
					if (value) {
						if ((filter_chl_open && ((new Date(value.end_date)) - (new Date()) <= 0)) || (!filter_chl_open && ((new Date(value.end_date)) - (new Date()) > 0)))
							data.splice(index, 1);
						else
							data[index].is_open = 'true';
					}
				});

				renderChallenges(data.response);
			},
			error: function(jqXHR, textStatus) {
				displayAlert('show', true, 'challenges', 'Error while retrieving data from CloudSpokes: ' + textStatus + '<br />Please open the extension again.');
			},
		});

		return;
	}

	var params = {};

	if (filter_chl_open) {
		params['order_by'] = !filter_chl_open ? 'end_date' : filter_chl_order_by;
		filter_chl_technology != '' ? params['technology'] = filter_chl_technology : null;
		filter_chl_platform != '' ? params['platform'] = filter_chl_platform : null;
		filter_chl_category != '' ? params['category'] = filter_chl_category : null;
	}

	$.ajax({
		url: api_url + '/challenges' + (!filter_chl_open ? '/closed' : ''),
		data: params,
		success: function(data) {
			displayAlert('hide', true, 'challenges');
			renderChallenges(data.response);

			/* Load dropdown bar filtering options */
			if (!filter_chl_dd) {
				$.ajax({
					url: api_url + '/platforms',
					success: function(data) {
						$.each(data.response, function(index, value) {
							$('#platformSelector ul').append('<li><a tabindex="-1" href="#">' + value + '</a></li>');
						});

						$("#platformSelector ul li a").click(function() {
							filter_chl_category = $(this).attr('value') == 'all' ? '' : $(this).html();
							loadChallenges();

							$("#platformSelector > a").html($(this).html() + ' <span class="caret"></span>');
						});
					},
					error: function(jqXHR, textStatus) {
						displayAlert('show', true, 'challenges', 'Error while retrieving data from CloudSpokes: ' + textStatus + '<br />Please open the extension again.');
					},
				});

				$.ajax({
					url: api_url + '/technologies',
					success: function(data) {
						$.each(data.response, function(index, value) {
							$('#technologySelector ul').append('<li><a tabindex="-1" href="#">' + value + '</a></li>');
						});

						$("#technologySelector ul li a").click(function() {
							filter_chl_category = $(this).attr('value') == 'all' ? '' : $(this).html();
							loadChallenges();

							$("#technologySelector > a").html($(this).html() + ' <span class="caret"></span>');
						});
					},
					error: function(jqXHR, textStatus) {
						displayAlert('show', true, 'challenges', 'Error while retrieving data from CloudSpokes: ' + textStatus + '<br />Please open the extension again.');
					},
				});

				$.ajax({
					url: api_url + '/categories',
					success: function(data) {
						$.each(data.response, function(index, value) {
							$('#categorySelector ul').append('<li><a tabindex="-1" href="#">' + value + '</a></li>');
						});

						$("#categorySelector ul li a").click(function() {
							filter_chl_category = $(this).attr('value') == 'all' ? '' : $(this).html();
							loadChallenges();

							$("#categorySelector > a").html($(this).html() + ' <span class="caret"></span>');
						});
					},
					error: function(jqXHR, textStatus) {
						displayAlert('show', true, 'challenges', 'Error while retrieving data from CloudSpokes: ' + textStatus + '<br />Please open the extension again.');
					},
				});

				filter_chl_dd = true;
			}
		},
		error: function(jqXHR, textStatus) {
			displayAlert('show', true, 'challenges', 'Error while retrieving data from CloudSpokes: ' + textStatus + '<br />Please open the extension again.');
		},
	});
}

/**
 * Load leaderboard content
 */
function loadLeaderboard() {
	displayAlert('show', false, 'leaderboard', 'Loading...');

	$.ajax({
		url: api_url + '/leaderboard.json',
		data: { period: filter_lb_period },
		success: function(data) {
			displayAlert('hide', true, 'leaderboard');
			var tableRows = [];

			$.each(data.response, function(index, value) {
				var money = '$' + value.total_money;
				money = money.substring(0, money.length - 2);

				if (money.length > 4)
					money = money.substring(0, money.length - 3) + ',' + money.substring(money.length - 3, money.length);

				tableRows.push([value.rank, value.username, value.country, value.active, value.wins, money]);
			});

			$('#leaderboardNavigation').html('');
			$('#leaderboardTable_wrapper').replaceWith('<table id="leaderboardTable"></table>');

			var table = $('#leaderboardTable').dataTable({
				"aaData": tableRows,
				"aoColumns": [
					{ "sTitle": "Rank" },
					{ "sTitle": "Username" },
					{ "sTitle": "Country" },
					{ "sTitle": "Active"},
					{ "sTitle": "Wins" },
					{ "sTitle": "Total Money" }
				],
				"fnDrawCallback": function(settings) {
					$('#leaderboardTable_paginate a').addClass('btn');
					$('#leaderboardTable_wrapper').addClass('well');
					$('#leaderboardTable_paginate a[class^="paginate_disabled_"]').addClass('disabled');
					$('#leaderboardTable_length, #leaderboardTable_filter').remove();
					$('#leaderboardTable_info, #leaderboardTable_paginate').appendTo('#leaderboardNavigation');
				}
			});

			$('#leaderboardFilters input').unbind().keyup(function() {
				table.fnFilter($(this).val());
			});
		},
		error: function(jqXHR, textStatus) {
			displayAlert('show', true, 'leaderboard', 'Error while retrieving data from CloudSpokes: ' + textStatus + '<br />Please open the extension again.');
		},
	});
}

/**
 * Load my challenges
 */
function loadMyChallenges() {
	displayAlert('show', false, 'my_challenges', 'Loading...');

	$.ajax({
		url: website_url + '/account/challenges.json',
		success: function(data) {
			displayAlert('hide', true, 'my_challenges');

			var tableRows = [];
			var table;

			var loadTable = function(records) {
				var ended = false;

				$.each(records, function(index, value) {
					var time = (function() {
						var ms = new Date((new Date(value.end_date)) - (new Date()));

						if (ms < 1) {
							ended = true;
							ms = 0-ms;
						}

						var cd = 24 * 60 * 60 * 1000;
						var ch = 60 * 60 * 1000;

						var d = Math.floor(ms / cd);
						var h = '0' + Math.floor( (ms - d * cd) / ch);
						var m = '0' + Math.round( (ms - d * cd - h * ch) / 60000);

						if (d)
							d += d == 1 ? ' day ' : ' days ';
						else
							d = '';

						if (h = parseInt(h.substr(-2)))
							h += h == 1 ? ' hour ' : ' hours ';
						else
							h = '';

						if (m = parseInt(m.substr(-2)))
							m += m == 1 ? ' minute ' : ' minutes ';
						else
							m = '';

						if (ended)
							return 'Ended ' + d + h + m + ' ago';
						return 'Due in ' + d + h + m;
					})();

					tableRows.push(['<a href="http://www.cloudspokes.com/challenges/' + value.challenge_id + '" target="_blank">' + value.name + '</a>', value.status, '$' + value.total_prize_money, time]);
				});

				$('#myChallengesNavigation').html('');
				$('#myChallengesTable_wrapper, #my_challenges .login').replaceWith('<table id="myChallengesTable"></table>');

				table = $('#myChallengesTable').dataTable({
					"aaData": tableRows,
					"aoColumns": [
						{ "sTitle": "Name" },
						{ "sTitle": "Status" },
						{ "sTitle": "Total Prize Money" },
						{ "sTitle": ended ? "Ended" : "Due" }
					],
					"fnDrawCallback": function(settings) {
						$('#myChallengesTable_paginate a').addClass('btn');
						$('#myChallengesTable_wrapper').addClass('well');
						$('#myChallengesTable_paginate a[class^="paginate_disabled_"]').addClass('disabled');
						$('#myChallengesTable_length, #myChallengesTable_filter').remove();
						$('#myChallengesTable_info, #myChallengesTable_paginate').appendTo('#myChallengesNavigation');
					}
				});
			}

			if (filter_myc_type == 'active') {
				if (!data.active || !data.active.length) {
					displayAlert('show', true, 'my_challenges', 'No challenges found.');
					return;
				}

				loadTable(data.active);

			} else if (filter_myc_type == 'past') {
				if (!data.past || !data.past.length) {
					displayAlert('show', true, 'my_challenges', 'No challenges found.');
					return;
				}

				loadTable(data.past);

			} else {
				if (!data.watching || !data.watching.length) {
					displayAlert('show', true, 'my_challenges', 'No challenges found.');
					return;
				}

				loadTable(data.watching);
			}

			$('#myChallengesFilters input').unbind().keyup(function() {
				table.fnFilter($(this).val());
			});
		},
		error: function(jqXHR, textStatus) {
			displayAlert('hide', true, 'my_challenges');

			if (jqXHR.status == 401) {
				if (triedLogin)
					displayAlert('show', true, 'my_challenges', 'Error while trying to log in.<br />Please try again.');

				$('#myChallengesTable, #my_challenges .login').replaceWith(getLoginHtml());
				$('.login').unbind().submit(login);

				return;
			}

			displayAlert('show', true, 'my_challenges', 'Error while retrieving data from CloudSpokes: ' + textStatus + '<br />Please open the extension again.');
		},
	});
}

/**
 * Load payments data
 */
function loadPayments() {
	displayAlert('show', false, 'payments', 'Loading...');

	$.ajax({
		url: website_url + '/account/payment-info.json',
		success: function(data) {
			displayAlert('hide', true, 'payments');

			var tableRows = [];
			var table;

			var loadTable = function(records) {
				$.each(records, function(index, value) {
					tableRows.push([value.name, '$' + value.money, value.reason, value.status, value.challenge.name, value.place]);
				});

				$('#paymentsNavigation').html('');
				$('#paymentsTable_wrapper, #payments .login').replaceWith('<table id="paymentsTable"></table>');

				table = $('#paymentsTable').dataTable({
					"aaData": tableRows,
					"aoColumns": [
						{ "sTitle": "Name" },
						{ "sTitle": "Amount" },
						{ "sTitle": "Reason" },
						{ "sTitle": "Status" },
						{ "sTitle": "Challenge" },
						{ "sTitle": "Place" }
					],
					"fnDrawCallback": function(settings) {
						$('#paymentsTable_paginate a').addClass('btn');
						$('#paymentsTable_wrapper').addClass('well');
						$('#paymentsTable_paginate a[class^="paginate_disabled_"]').addClass('disabled');
						$('#paymentsTable_length, #paymentsTable_filter').remove();
						$('#paymentsTable_info, #paymentsTable_paginate').appendTo('#paymentsNavigation');
					}
				});
			}

			if (filter_pay_type == 'outstanding') {
				if (!data.outstanding || !data.outstanding.length) {
					displayAlert('show', true, 'payments', 'No payments found.');
					return;
				}

				loadTable(data.outstanding);

			} else {
				if (!data.paid || !data.paid.length) {
					displayAlert('show', true, 'payments', 'No payments found.');
					return;
				}

				loadTable(data.paid);
			}

			$('#paymentsFilters input').unbind().keyup(function() {
				table.fnFilter($(this).val());
			});
		},
		error: function(jqXHR, textStatus) {
			displayAlert('hide', true, 'payments');

			if (jqXHR.status == 401) {
				$('#paymentsTable, #payments .login').replaceWith(getLoginHtml());
				$('.login').unbind().submit(login);

				return;
			}

			displayAlert('show', true, 'payments', 'Error while retrieving data from CloudSpokes: ' + textStatus + '<br />Please open the extension again.');
		},
	});
}

/**
 * Load inbox
 */
function loadInbox() {
	displayAlert('show', false, 'inbox', 'Loading...');

	$.ajax({
		url: website_url + '/messages/inbox.json',
		success: function(data) {
			displayAlert('hide', true, 'inbox');

			if (!data.length) {
				displayAlert('show', true, 'inbox', 'No messages found.');
				return;
			}

			var tableRows = [];
			var table;

			$.each(data, function(index, value) {
				tableRows.push([value.display_user, value.subject, value.replies, (value.status).charAt(0).toUpperCase() + (value.status).slice(1), (function() {
					var ms = new Date((new Date()) - (new Date(value.datetime)));

					var cd = 24 * 60 * 60 * 1000;
					var ch = 60 * 60 * 1000;

					var d = Math.floor(ms / cd);
					var h = '0' + Math.floor( (ms - d * cd) / ch);
					var m = '0' + Math.round( (ms - d * cd - h * ch) / 60000);

					if (d)
						d += d == 1 ? ' day ' : ' days ';
					else
						d = '';

					if (h = parseInt(h.substr(-2)))
						h += h == 1 ? ' hour ' : ' hours ';
					else
						h = '';

					if (m = parseInt(m.substr(-2)))
						m += m == 1 ? ' minute ' : ' minutes ';
					else
						m = '';

					return 'Received ' + d + h + m + ' ago';
				})()]);
			});

			$('#inboxNavigation').html('');
			$('#inboxTable_wrapper, #inbox .login').replaceWith('<table id="inboxTable"></table>');

			table = $('#inboxTable').dataTable({
				"aaData": tableRows,
				"aoColumns": [
					{ "sTitle": "From" },
					{ "sTitle": "Subject" },
					{ "sTitle": "Replies" },
					{ "sTitle": "Status" },
					{ "sTitle": "Date" }
				],
				"fnDrawCallback": function(settings) {
					$('#inboxTable_paginate a').addClass('btn');
					$('#inboxTable_wrapper').addClass('well');
					$('#inboxTable_paginate a[class^="paginate_disabled_"]').addClass('disabled');
					$('#inboxTable_length, #inboxTable_filter').remove();
					$('#inboxTable_info, #inboxTable_paginate').appendTo('#inboxNavigation');
				}
			});

			$('#inboxFilters input').unbind().keyup(function() {
				table.fnFilter($(this).val());
			});
		},
		error: function(jqXHR, textStatus) {
			displayAlert('hide', true, 'inbox');

			if (jqXHR.status == 401) {
				$('#inboxTable, #inbox .login').replaceWith(getLoginHtml());
				$('.login').unbind().submit(login);

				return;
			}

			displayAlert('show', true, 'inbox', 'Error while retrieving data from CloudSpokes: ' + textStatus + '<br />Please open the extension again.');
		},
	});
}

function login() {
	if (triedLogin) {
		displayAlert('show', true, 'my_challenges', 'Error while trying to log in.<br />Please try again.');
		displayAlert('show', true, 'payments', 'Error while trying to log in.<br />Please try again.');
		displayAlert('show', true, 'inbox', 'Error while trying to log in.<br />Please try again.');
	}

	$.ajax({
		url: website_url + '/users/sign_in',
		type: 'POST',
		data: {
			'user[username]': $('.login input[name="username"]').val(),
			'user[password]': $('.login input[name="password"]').val(),
			'user[remember_me]': 1

		},
		success: function(data) {
			triedLogin = true;

			loadMyChallenges();
			loadPayments();
			loadInbox();
		}
	});

	return false;
}

/**
 * Change shown content
 */
function switchPage(page) {
	/* List of pages and their containers (in order to know what to hide/show when showing/hiding alerts (loading/error)) */
	var pages = {
		'home': 'homeContainer',
		'challenges': 'challengesContainer',
		'leaderboard': 'leaderboard',
		'my_challenges': 'my_challenges',
		'payments': '',
		'inbox': ''
	}

	active_page = page;
	active_container = pages[page];

	$.each(pages, function(name, container) {
		$('#'+name).css('display', 'none');
		$('#'+name).css('visibility', 'hidden');
	});

	$('#'+page).css('display', 'block');
	$('#'+page).css('visibility', 'visible');
}

/**
 * Show/hide loading/error alert
 */
function displayAlert(action, error, page, message) {
	if (action == 'show')
		$('#'+page+'>.statusAlert').css('display', 'block').html(message).removeClass('alert-error').addClass(error ? 'alert-error' : '');

	else if (action == 'hide')
		$('#'+page+'>.statusAlert').css('display', 'none');
}

/**
 * Show challenges on page
 */
function renderChallenges(response) {
	if (filter_chl_order == 'desc')
		response = response.reverse();

	if (!response.length)
		displayAlert('show', true, 'challenges', 'No challenges found.');
	else {
		$('#challengesContainer').empty();
		for (var i = 0; i < response.length; i+=2)
			$('#challengesContainer').append('<div class="row-fluid">' + (getChallengeHtml(response[i])) + (getChallengeHtml(response[i+1])) + '</div>');

		/* Listener for tag clicks */
		$('a.tagUrl').unbind().click(function() {
			filter_chl_technology = $(this).attr('value') == 'all' ? '' : $(this).html();
			loadChallenges();

			$("#technologySelector > a").html($(this).html() + ' <span class="caret"></span>');
		});
	}
}

/**
 * Get login box html
 */
function getLoginHtml() {
	var html = '';

	html += '<form class="well login">';
	html += '<input type="text" name="username" placeholder="Username">';
	html += '<input type="password" name="password" placeholder="Password">';
	html += '<button class="btn btn-warning pull-right">Submit</button>';
	html += '</form>';

	return html;
}
/**
 * Get challenge html
 */
function getChallengeHtml(response) {
	if (!response)
		return '';

	var html = '';

	var due_in = (function() {
		var ms = new Date((new Date(response.end_date)) - (new Date()));

		if (!response.is_open || ms < 1)
			return 'Completed';

		var cd = 24 * 60 * 60 * 1000;
		var ch = 60 * 60 * 1000;

		var d = Math.floor(ms / cd);
		var h = '0' + Math.floor( (ms - d * cd) / ch);
		var m = '0' + Math.round( (ms - d * cd - h * ch) / 60000);

		if (d)
			d += d == 1 ? ' day ' : ' days ';
		else
			d = '';

		if (h = parseInt(h.substr(-2)))
			h += h == 1 ? ' hour ' : ' hours ';
		else
			h = '';

		if (m = parseInt(m.substr(-2)))
			m += m == 1 ? ' minute ' : ' minutes ';
		else
			m = '';

		return 'Due in ' + d + h + m;
	})();

	var description = (function() {
		var temp = document.createElement("div");
		temp.innerHTML = response.description;

		return ($(temp).text()).substring(0, 300) + '...';
	})();


	var forTags = (function() {
		var string = '';

		if (!response.challenge_platforms__r)
			return '';

		$.each(response.challenge_platforms__r.records, function(index, record) {
			if (string != '')
				string += ', ';

			string += record.name;
		});

		return string;
	})();

	var tags = (function() {
		var string = '';

		if (!response.challenge_technologies__r)
			return '';

		$.each(response.challenge_technologies__r.records, function(index, record) {
			if (string != '')
				string += ', ';

			string += '<a class="tagUrl">' + record.name + '</a>';
		});

		return string;
	})();


	var members = (function() {
		var members = '';

		if (response.participating_members) {
			members += response.participating_members + (response.participating_members == 1 ? ' member' : ' members') + ' participating, ';
			return members + response.registered_members + ' registered';

		} else
			return response.registered_members + (response.registered_members == 1 ? ' member' : ' members') + ' registered';
	})();

	html += '<div class="span6">';
	html += '<div class="challenge well well-large">';
	html += '<table class="type ' + response.challenge_type.toLowerCase() + '"><tr><td>' + response.challenge_type.toUpperCase() + '</td></tr></table>';
	html += '<h3><a href="http://www.cloudspokes.com/challenges/' + response.challenge_id + '" target="_blank">' + response.name + '</a></h3>';
	html += due_in;
	html += '<p>' + description + '</p>';
	html += members + '<br/><strong>$' + response.total_prize_money + (forTags != '' ? ' for ' : '') + forTags + '</strong><br>';
	html += tags != '' ? 'Tags: ' + tags : '';
	html += '</div>';
	html += '</div>';

	return html;
}

$(document).ready(init);
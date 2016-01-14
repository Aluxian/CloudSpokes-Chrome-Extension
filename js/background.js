/* Create alarm */
chrome.alarms.create('newChallenge', {periodInMinutes: 1});

/* Alarm listener */
chrome.alarms.onAlarm.addListener(function(alarm) {
	$.ajax({
	    url: 'http://api.cloudspokes.com/v1/challenges',
	    data: { order_by: 'start_date' },
	    type: 'GET',
	    success: function(data) {
	    	var response = data.response.reverse()[0];

	    	/* Check if the retrieved challenge is recent */
	    	if (((new Date()) - (new Date(response.start_date))) / 1000 / 60 / 60 > 1)
	    		return;

	    	/* Parse data */
	    	var html = '<h3>' + response.name + '</h3>' + '<p>' + (getDescription(response.description)) + '</p>' + '<strong>$' + response.total_prize_money + '</strong> for <strong>' + (joinForTags(response.challenge_platforms__r.records)) + '</strong>';

			/* Show notification */
	    	var notification = webkitNotifications.createHTMLNotification('html/notification.html#' + escape(html));
			notification.show();

			/* Click listener */
			notification.onclick = function() {
				window.open('http://www.cloudspokes.com/challenges/' + response.challenge_id);
				notification.cancel();
			};

			/* Timeout to close the notification */
			setTimeout(function() {
				notification.cancel();
			}, 10 * 1000);
		}
	});
});

/**
 * Format description
 */
function getDescription(response) {
	var temp = document.createElement("div");
	temp.innerHTML = response;

	return ($(temp).text()).substring(0, 190) + '...';
}

/**
 * Join platforms tags
 */
function joinForTags(records) {
	var string = '';

	$.each(records, function(index, record) {
		if (string != '')
			string += ', ';
		string += record.name;
	});

	return string;
}
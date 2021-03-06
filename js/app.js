(function(){
    'use scrict';
    /* UI Components */

	var isRunning = true;
	var button = document.getElementById('toggle');

	button.addEventListener('click', function(e){
		if(isRunning) {
			pubnub.unsubscribe({
				channel: channel
			});
			button.value = 'Continuar';
			isRunning = false;
		} else {
			getData();
			button.value = 'Pausar';
			isRunning = true;
		}

	}, false);


	/* Emotional Data */

	var tally = {};

	var negativeColor = '#FF8586';
	var positiveColor = '#63A69F';
	var neutralColor = '#DECEB3';

	var positive = {
		type: 'positive',
		icon: 'grinning-face.png'
	};
	var happy = {
		type: 'positive',
		icon: 'smiling-face.png'
	};
	var lovely = {
		type: 'positive',
		icon: 'heart-eyed-happy-face.png'
	};
	var negative = {
		type: 'negative',
		icon: 'pensive-face.png'
	};
	var sad = {
		type: 'negative',
		icon: 'crying-face.png'
	};
	var angry = {
		type: 'negative',
		icon: 'angry-face.png'
	};
	var sick = {
		type: 'negative',
		icon: 'sick-face.png'
	};

	var positiveWords = [
		 'excelente', 'sensacional', 'lindo', 'magnífico', 'fabuloso', 'fantástico',
         'pacífico', 'brilhante', 'glorioso', 'gracioso', 'esplêndido', 'honrável', 'inspirável',
		 'virtuouso', 'orgulhoso', 'maravilhoso', 'amável', 'sensacional'
	];
	var happyWords = [
		'feliz', 'sorte', 'animado', 'legal', 'abençoado', ':-)', ':)', ':-D', ':D', '=)','☺'
	];
	var lovelyWords = [
		'amor', 'adoro', 'amando', 'amável', 'querida', 'casado', 'noivo', 'noiva', 'casada',
        'sensa', 'lindo', 'te amo'
	];
	var negativeWords = [
		'infeliz', 'ruim', 'desculpe', 'noiado', 'não curto', 'ansioso', 'envergonhado',
        'quebrado', 'bosta', 'maldoso', 'horrível', 'entediado', 'tédio', 'queimado', 'caótico',
        'derrotado', 'devastado', 'estressado', 'desconectado', 'desencorajado', 'desonesto',
        'embaraçado', 'louco', 'frustrado', 'estúpido', 'culpado', 'sem esperança', 'horrível',
        'humilhado', 'ignorante', 'desumano', 'cruel', 'insano', 'inseguro', 'nervoso',
        'ofendido', 'oprimido', 'patético', 'pobre', 'ferrado', 'sqn', 'vacilao', 'eu mato'
	];
	var sadWords = [
		'triste', 'sozinho', 'ansioso', 'deprimido', 'desapontado', 'desapontador', 'aff', 'chorando', 'chorei', 'sozinho', 'cabisbaixo', 'sensível', 'sem esperança', 'ferido', 'miserável',
        'ninguém entende', 'suicida', ':-(', ':(', '=(', ';('
	];
	var angryWords = [
		'ódio', 'merda', 'raiva', 'traído', 'nojo', 'perturbado', 'furioso', 'assediado', 'odioso', 'hostil', 'insultado', 'odeio', 'odio', 'safadeza', 'putaria', 'viadagem',
		'irritável', 'ciúme', 'puto', 'irado', 'lixo', 'safado', 'trairagem',

	];
	var sickWords = [
		'doente', 'vomitei', 'vomitando', 'vômito', 'vomitando', 'dor', 'ressaca',
        'chapado', 'febre', 'colica', 'dor de cabeça'
	];


	/* D3  */

	var width = 800;
	var height = 700;

	var color = d3.scale.linear().domain([0, 15])
        .range(['#5b5858', '#4f4d4d', '#454444', '#323131'])


	var svg = d3.select('#map').append('svg')
			.attr('width', width)
			.attr('height', height);

	var g = svg.append('g');
    var scale = 900;
    var projection = d3.geo.mercator().center([-50, -10]).scale(scale);
    var path = d3.geo.path().projection(projection);

	d3.json('json/br-states.json', function(error, br) {
        var units = topojson.feature(br, br.objects.states);
	    g.selectAll('path')
			.data(units.features)
			.enter()
			.append('path')
			.attr('class', function(d){ return 'states ' + d.properties.name;} )
			.attr('d', path)
			.attr('fill', function(d, i) { return color(i); });
	});

	var faceIcon = svg.selectAll('image').data([0]);

    /* PubNub */

	var channel = 'pubnub-twitter';
	var pubnub = PUBNUB.init({
		subscribe_key: 'sub-c-78806dd4-42a6-11e4-aed8-02ee2ddab7fe'
	});

	// fetching previous 100 data, then realtime stream
	function getData() {
		pubnub.history({
	    	channel: channel,
	    	count: 100,
	    	callback: function(messages) {
	    		pubnub.each( messages[0], processData );
	    		getStreamData();
	    	},
	    	error: function(error) {
	    		if(error) {
	    			getStreamData();
	    		}
	    	}
	    });
	}

	function getStreamData() {
		pubnub.subscribe({
			channel: channel,
			callback: processData
		});
	}

	function getUserInfo(data, callback) {
		if(!data.geo) return;

		var userInfo = {};

		userInfo.lat = data.geo.coordinates[0];
		userInfo.lon = data.geo.coordinates[1];

		if(userInfo.lat === 0 && userInfo.lon === 0) return;

		var city = data.place.full_name;
		userInfo.city = city;
		userInfo.state = city.substring(city.lastIndexOf(',')+1).trim();

		userInfo.name = data.user.name;
		userInfo.screenname = data.user.screen_name;
		userInfo.avatar = data.user.profile_image_url;
		userInfo.tweet = data.text;
		userInfo.id_str = data.id_str;

		var date = new Date(parseInt(data.timestamp_ms));
		var d = date.toDateString().substr(4);
		var t = (date.getHours() > 12) ? date.getHours()-12 + ':' + date.getMinutes() + ' PM' : date.getHours() + ':' + date.getMinutes() +' AM;';

		userInfo.timestamp = t + ' - ' + d;

		callback(userInfo);
	}

	function insertLinks(text) {
        return text.replace(/((https?|s?ftp|ssh)\:\/\/[^"\s\<\>]*[^.,;'">\:\s\<\>\)\]\!])/g, function(url){return '<a href="'+url+'" >'+url+'</a>';});
    }

    function getStatePrefix(state) {
        state = state.toString().toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');

        if (state === 'brasil') return;

        states = {
            'acre': 'AC',
            'alagoas': 'AL',
            'amap': 'AP',
            'amazonas': 'AM',
            'bahia': 'BA',
            'cear': 'CE',
            'distrito-federal': 'DF',
            'esprito-santo': 'ES',
            'gois': 'GO',
            'maranho': 'MA',
            'mato-grosso': 'MT',
            'mato-grosso-do-sul': 'MS',
            'minas-gerais': 'MG',
            'par': 'PA',
            'paraba': 'PB',
            'paran': 'PR',
            'pernambuco': 'PE',
            'piau': 'PI',
            'rio-de-janeiro': 'RJ',
            'rio-grande-do-norte': 'RN',
            'rio-grande-do-sul': 'RS',
            'rondnia': 'RO',
            'roraima': 'RR',
            'santa-catarina': 'SC',
            'so-paulo': 'SP',
            'sergipe': 'SE',
            'tocantins': 'TO'
        };
        return states[state];
    }

	function displayData(data, emotion) {
		getUserInfo(data, function(user){
			document.querySelector('.emotion').style.backgroundImage = 'url(images/'+ emotion.icon +')';

			document.querySelector('.button').href = 'https://twitter.com/' + user.screenname;
			document.querySelector('.header').style.backgroundImage = 'url('+ user.avatar +')';
			document.querySelector('.name').textContent = user.name;
			document.querySelector('.screenname').textContent = '@' + user.screenname;
			document.querySelector('.text').innerHTML = twemoji.parse(insertLinks(user.tweet));
			document.querySelector('.timestamp').textContent = user.timestamp;

			document.querySelector('.reply').href ='https://twitter.com/intent/tweet?in_reply_to=' + user.id_str;
			document.querySelector('.retweet').href = 'https://twitter.com/intent/retweet?tweet_id=' + user.id_str;
			document.querySelector('.favorite').href = 'https://twitter.com/intent/favorite?tweet_id=' + user.id_str;

			document.querySelector('.tweet').style.opacity = 0.9;
            var stateSelector = getStatePrefix(user.state);
            if (stateSelector && document.querySelector('.' + stateSelector)) {
				tally[user.state] = (tally[user.state] || {positive: 0, negative: 0});
				tally[user.state][emotion.type] = (tally[user.state][emotion.type] || 0) + 1;

				var stateEl = document.querySelector('.'+stateSelector);
				stateEl.style.fill = (tally[user.state].positive > tally[user.state].negative) ? positiveColor : ((tally[user.state].positive < tally[user.state].negative) ? negativeColor :neutralColor);

				stateEl.setAttribute('data-positive', tally[user.state].positive);
				stateEl.setAttribute('data-negative', tally[user.state].negative);
			}

			// Place emotion icons

			var position = projection([user.lon, user.lat]);
			if(position === null) return;

			faceIcon.enter()
				.append('svg:image')
				.attr('xlink:href', 'images/'+ emotion.icon)
				.attr('width', '26').attr('height', '26')
           		.attr('transform', function(d) {return 'translate(' + position + ')';});
		});
	}

	function processData(data) {
		if(!data || !data.place || !data.lang) return;
		if(data.place.country_code !== 'BR') return;

		if (positiveWords.some(function(v) { return data.text.toLowerCase().indexOf(v) > 0; })) {
			displayData(data, positive);
		} else if (happyWords.some(function(v) { return data.text.toLowerCase().indexOf(v) > 0; })) {
			displayData(data, happy);
		} else if (lovelyWords.some(function(v) { return data.text.toLowerCase().indexOf(v) > 0; })) {
			displayData(data, lovely);
		} else if (negativeWords.some(function(v) { return data.text.toLowerCase().indexOf(v) > 0; })) {
			displayData(data, negative);
		} else if (sadWords.some(function(v) { return data.text.toLowerCase().indexOf(v) > 0; })) {
			displayData(data, sad);
		} else if (angryWords.some(function(v) { return data.text.toLowerCase().indexOf(v) > 0; })) {
			displayData(data, angry);
		} else if (sickWords.some(function(v) { return data.text.toLowerCase().indexOf(v) > 0; })) {
			displayData(data, sick);
		}
	}
	getData();
})();

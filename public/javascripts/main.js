$(document).ready(function(){

  const socket = io();

  $('.search button').on('click', () => {
    $('.alert-danger').remove();
    if (!$('input#city').val()){
      $('.container').prepend(`<div class="alert alert-danger" role="alert">
        Oops, you haven't entered a city.
      </div>`)
    }
    else{
      toggleLoader()
      handleSearch()
    }
  });
  $('input#city').geocomplete({
    map: false
  });

  function handleSearch(){
    const userInput = $('input#city').val();
    let sendVal = userInput.split(','); //API cant handle country as param
    socket.emit('location_search', sendVal[0]);
  }

  function initMap(floatLat, floatLng){
    document.querySelectorAll('script').forEach( scrpt => {
      if (scrpt.getAttribute('id') === 'mapHandle' || scrpt.getAttribute('id') === 'mapSrc'){
        scrpt.parentNode.removeChild(scrpt);
      }
    });
    jQuery('<script/>', {
      id: 'mapHandle',
      text: `  function handleMap(){
    let options = {
      zoom: 13,
      center: {lat:${floatLat}, lng:${floatLng}}
    };

    let map = new google.maps.Map(document.getElementById('containerMap'), options);
    
    var market = new google.maps.Marker({
      position:{lat:${floatLat}, lng:${floatLng}},
      map:map
    })
  }`
    }).appendTo('body');
    jQuery('<script/>', {
      id: 'mapSrc',
      src: 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDV6A-DSEX6gi0CtFcWq_Y60vmL7USw43A&callback=handleMap'
    }).appendTo('body');

  }

  function handleGraph(maxTemp, minTemp, days, avgTemp){
    Highcharts.chart('containerGraph', {
      chart: {
        type: 'column'
      },
      title: {
        text: 'Six Day Forecast'
      },
      xAxis: {
        categories: [
          days[0], //arguments days
          days[1],
          days[2],
          days[3],
          days[4],
          days[5]
        ],
        crosshair: true
      },
      yAxis: {
        min: 0,
        title: {
          text: `Degrees (${String.fromCharCode(176)}c)`
        }
      },
      tooltip: {
        headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
        pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
        '<td style="padding:0"><b>{point.y:.1f} &#176;c</b></td></tr>',
        footerFormat: '</table>',
        shared: true,
        useHTML: true
      },
      plotOptions: {
        column: {
          pointPadding: 0.2,
          borderWidth: 0
        }
      },
      series: [{
        name: 'Max Temp',
        data: [maxTemp[0], maxTemp[1], maxTemp[2], maxTemp[3], maxTemp[4], maxTemp[5]], //arguments tempareture
        color: '#18a9f2'

      },
        {
          name: 'Avg Temp',
          data: [avgTemp[0], avgTemp[1], avgTemp[2], avgTemp[3], avgTemp[4], avgTemp[5]], //arguments tempareture
          color: '#363636'

        }, {
          name: 'Min Temp',
          data: [minTemp[0], minTemp[1], minTemp[2], minTemp[3], minTemp[4], minTemp[5]], //arguments
          color: '#39c62f'

        }]
    });
  }

  function handleStats(temp, weather, sundown){

    var currentdate = new Date();
    var sundate = new Date(sundown);
    var hours = parseInt(Math.abs(currentdate - sundate) / 36e5);
    var sun_final = ``;
    if (hours == 0){
      sun_final = `Now`
    }
    else{
      sun_final = hours == 1 ? `${hours}~ hour` : `${hours} hours`;
    }
    let newtemp = `${parseFloat(Math.round(temp * 100) / 100).toFixed(2)} ${String.fromCharCode(176)}c`;

    var statsArr = [newtemp,weather, sun_final];
    $('.stats-bot').each( function(i, val){
      $(this).text(`${statsArr[i]}`)
    })
  }

  function toggleLoader(){
    $('.btn-search span').toggleClass('active')
    $('.btn-search .form-loader').toggleClass('active')
  }

  socket.on('location_searchRESP', function (l_resp) {

    const cityResp = JSON.parse(l_resp);

    if (cityResp.length){
      let cityResp = JSON.parse(l_resp);
      socket.emit('weather_search', cityResp[0].woeid);
    }
    else{
      $('.container').prepend(`<div class="alert alert-danger" role="alert">
        Oops, we couldn't find a city named ${$('input#city').val()}.
      </div>`);
      toggleLoader()
    }

  });

  socket.on('weather_searchRESP', function (w_resp) {

    const weatherResp = JSON.parse(w_resp);
    if (weatherResp){
      $('.container section').each(function(){
        $(this).removeClass('hidden')
      });
      const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      let maxArr = [];
      let minArr = [];
      let daysArr = [];
      let avgArr = [];
      const city_weather = weatherResp.consolidated_weather;
      city_weather.forEach( day => {
        maxArr.push(parseInt(day.max_temp));
        minArr.push(parseInt(day.min_temp));
        avgArr.push(parseInt(day.the_temp));
        let parse_day = day.applicable_date.split("-");
        let str_day = `${parse_day[2]}. ${monthNames[(parseInt(parse_day[1])-1)].substring(0, 3)}`;
        daysArr.push(str_day)
      });
      handleGraph(maxArr, minArr, daysArr, avgArr);
      handleStats(city_weather[0]['the_temp'], city_weather[0]['weather_state_name'], weatherResp['sun_set']);
      let lat_long = weatherResp.latt_long.split(',');
      let floatLong = lat_long[1];
      let floatLat = lat_long[0];
      initMap(floatLat, floatLong);
      toggleLoader()
      $('html, body').animate({
        scrollTop: $(".stats.row").offset().top
      }, 2000);
    }
    else{
      $('.container').prepend(`<div class="alert alert-danger" role="alert">
        Oops, we couldn't any weather data for ${$('input#city').val()}.
      </div>`);
      toggleLoader()
    }

  })
});
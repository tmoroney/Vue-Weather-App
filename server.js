import express from "express";
import axios from "axios";
import url from "url";

const app = express();
app.use(express.json());

const PORT = 3000;
const apiKey = ''; // Open Weather Map API Key
const pexelsAPI = ''; // Pexels stock images API key
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

app.listen(PORT, () => {
    console.log("Server Listening on PORT:", PORT);
});

// Serve the "index.html" file
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

function calculateOutdoorRating(temperature, humidity, rain) {
    var outdoorRating = 10;
    if (temperature < 5) {
        outdoorRating -= 3;
    } else if (temperature < 13) {
        outdoorRating -= 2;
    } else if (temperature > 30 && humidity > 55) {
        outdoorRating -= 3;
    } else if (temperature > 35) {
        outdoorRating -= 3;
    }

    if (humidity > 70) {
        outdoorRating -= 2;
    }

    if (rain > 35) {
        outdoorRating -= 5;
    } else if (rain > 15) {
        outdoorRating -= 3;
    } else if (rain > 2) {
        outdoorRating -= 2;
    } else if (rain > 0 && temperature < 13) {
        outdoorRating -= 2;
    } else if (rain > 0) {
        outdoorRating -= 1;
    }

    return outdoorRating;
}

function capitalizeWords(str) {
    return str.replace(/\b\w/g, function (match) {
        return match.toUpperCase();
    });
}

app.get("/weather/:city", async (request, response) => {
    const city = request.params.city;
    try {
        const locations = await axios.get(`http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=4&appid=${apiKey}`);
        if (locations.data.length == 0) {
            response.send({ error: 'No results found' });
            return;
        }
        const lat = locations.data[0].lat;
        const lon = locations.data[0].lon;
        const result = await axios.get(`http://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);
        const airPolution = await axios.get(`http://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}`);

        var weatherData = {
            city: locations.data[0].name,
            country: locations.data[0].country,
            countryCode: locations.data[0].country.toLowerCase(),
            lat: lat,
            lon: lon,
            type: '',
            averageTemp: 0,
            tempColor: 'Blue',
            averageRainfall: 0,
            averageWindSpeed: 0,
            airQuality: 0,
            airPolutionWarning: false,
            highestAirPolution: 0,
            daysWithRain: [],
            umbrellaWarning: false,
            imageUrl: '',
            summary: {},
            days: null
        };

        const imageData = await axios.get('https://api.pexels.com/v1/search', {
            params: { query: `${weatherData.city}`, per_page: 1 }, // You can adjust 'per_page' as needed
            headers: {
                'Authorization': pexelsAPI,
            },
        });

        var totalWindSpeed = 0;
        var totalTemp = 0;
        var count = 1;
        var info = {};
        for (let i = 0; i < result.data.list.length; i++) {
            var data = {
                temp: result.data.list[i].main.temp,
                feels_like: result.data.list[i].main.feels_like,
                humidity: result.data.list[i].main.humidity,
                precipitation: result.data.list[i].rain ? result.data.list[i].rain["3h"] : 0,
                wind_speed: result.data.list[i].wind.speed,
                description: capitalizeWords(result.data.list[i].weather[0].description),
                time: result.data.list[i].dt_txt.split(' ')[1].replace(/:00$/, '')
            };

            var dayNum = new Date(result.data.list[i].dt_txt).getDay();
            var day = dayNames[dayNum];

            if (data.description.includes('Rain') && !weatherData.daysWithRain.includes(day)) {
                weatherData.daysWithRain.push(day);
                weatherData.umbrellaWarning = true;
            }

            count++;
            totalTemp += data.temp;
            totalWindSpeed += data.wind_speed;
            info[day] = info[day] ? info[day].concat(data) : [data];
        }

        weatherData.days = info;

        var averageTemp = totalTemp / count;
        if (averageTemp < 13) {
            weatherData.type = 'cold';
            weatherData.tempColor = 'blue';
        } else if (averageTemp <= 23) {
            weatherData.type = 'mild';
            weatherData.tempColor = 'orange';
        } else {
            weatherData.type = 'hot';
            weatherData.tempColor = 'red';
        }

        var count = 0;
        var totalAirPolution = 0;
        var highestAirPolution = 0;
        var airPolutionCount = 0;
        while (count < airPolution.data.list.length) {
            var airQuality = airPolution.data.list[count].components.pm2_5;
            totalAirPolution += airQuality;
            count++;
            if (airQuality > 15) {
                airPolutionCount++;
                if (airPolutionCount == 20) { // stop single hour of high air polution from triggering warning
                    weatherData.airPolutionWarning = true;
                }
            }
            if (airQuality > highestAirPolution) {
                highestAirPolution = airQuality;
            }
        }

        weatherData.averageTemp = Math.floor(averageTemp);
        weatherData.averageWindSpeed = (totalWindSpeed / count).toFixed(2);
        weatherData.airQuality = Math.floor(totalAirPolution / count);
        weatherData.highestAirPolution = highestAirPolution; // not used

        // add summary for each day
        var totalPrecipitation = 0;
        for (const day in weatherData.days) {
            var precipitation = 0;
            var totalTemperature = 0;
            var totalHumidity = 0;
            for (let i = 0; i < weatherData.days[day].length; i++) {
                precipitation += weatherData.days[day][i].precipitation;
                totalTemperature += weatherData.days[day][i].temp;
                totalHumidity += weatherData.days[day][i].humidity;
            }
            var averageTemperature = Math.floor(totalTemperature / weatherData.days[day].length);
            var averageHumidity = Math.floor(totalHumidity / weatherData.days[day].length);
            var outdoorRating = calculateOutdoorRating(averageTemperature, averageHumidity, precipitation.toFixed(2));
            weatherData.summary[day] = {
                rain: precipitation.toFixed(2),
                temp: averageTemperature,
                humidity: averageHumidity,
                outdoorRating: Math.floor(outdoorRating)
            };
            totalPrecipitation += precipitation;
        }
        weatherData.averageRainfall = (totalPrecipitation / Object.keys(weatherData.summary).length).toFixed(1);

        if (imageData.data.photos.length > 0) {
            weatherData.imageUrl = imageData.data.photos[0].src.landscape; // Get the first image from the search results
        }

        response.send(weatherData);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
});

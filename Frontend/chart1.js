// Improved parseDate function
function parseDate(dateString) {
    return moment(dateString);
}

async function fetchData() {
    console.log('ive been called')
    try {
        const response = await fetch('http://localhost:3000/api/entries');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Fetched Data:", data);
        return data;
    } catch (error) {
        console.error("Failed to fetch data:", error);
        return [];
    }
}

function processData(rawData) {
    if (!Array.isArray(rawData) || rawData.length === 0) {
        console.error("No valid raw data available.");
        return { productionData: [], consumptionData: [] };
    }

    const productionData = [];
    const consumptionData = [];

    rawData.forEach(entry => {
        if (!entry._id || !entry.observations || !Array.isArray(entry.observations)) {
            console.error(`Invalid entry structure:`, entry);
            return;
        }

        const baseDate = parseDate(entry._id);
        const isConsumption = entry.type === "Consumption";

        entry.observations.forEach(obs => {
            if (typeof obs.volume !== 'number' || typeof obs.sequence !== 'number') {
                console.error(`Invalid observation:`, obs);
                return;
            }

            const point = {
                x: baseDate.clone().add((obs.sequence - 1) * 15, 'minutes'),
                y: obs.volume
            };

            if (isConsumption) {
                consumptionData.push(point);
            } else {
                productionData.push(point);
            }
        });
    });

    console.log("Processed Production Data:", productionData);
    console.log("Processed Consumption Data:", consumptionData);

    return { productionData, consumptionData };
}

function aggregateData(data, interval) {
    const aggregated = [];
    for (let i = 0; i < data.length; i += interval) {
        const chunk = data.slice(i, i + interval);
        const avgPoint = {
            x: chunk[0].x,
            y: chunk.reduce((sum, point) => sum + point.y, 0) / chunk.length
        };
        aggregated.push(avgPoint);
    }
    return aggregated;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

async function createChart() {
    const rawData = await fetchData();
    let { productionData, consumptionData } = processData(rawData);

    // Ensure productionData and consumptionData are arrays
    productionData = Array.isArray(productionData) ? productionData : [];
    consumptionData = Array.isArray(consumptionData) ? consumptionData : [];

    console.log("Production Data:", productionData);
    console.log("Consumption Data:", consumptionData);

    const ctx = document.getElementById('gainLossChart');
    if (!ctx) {
        console.error("Cannot find canvas element with id 'gainLossChart'");
        return;
    }

    if (productionData.length === 0 && consumptionData.length === 0) {
        console.error("No valid data to create chart");
        // Optionally, display a message to the user
        ctx.innerHTML = "No data available to display the chart.";
        return;
    }

    let currentInterval = 1;

    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Production Volume',
                    data: productionData,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                },
                {
                    label: 'Consumption Volume',
                    data: consumptionData,
                    borderColor: 'rgb(255, 99, 132)',
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day',
                        displayFormats: {
                            millisecond: 'HH:mm:ss.SSS',
                            second: 'HH:mm:ss',
                            minute: 'DD MMM HH:mm',
                            hour: 'DD MMM HH:mm',
                            day: 'DD MMM YYYY',
                            week: 'DD MMM YYYY',
                            month: 'MMM YYYY',
                            quarter: 'MMM YYYY',
                            year: 'YYYY'
                        }
                    },
                    ticks: {
                        autoSkip: true,
                        maxRotation: 0,
                        major: {
                            enabled: true
                        },
                        font: function(context) {
                            if (context.tick && context.tick.major) {
                                return {
                                    weight: 'bold'
                                };
                            }
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Volume'
                    }
                }
            },
            plugins: {
                zoom: {
                    zoom: {
                        wheel: {
                            enabled: true,
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'x',
                    },
                    pan: {
                        enabled: true,
                        mode: 'x',
                    },
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            }
        }
    });
    const updateChartData = debounce((newProductionData, newConsumptionData) => {
        chart.data.datasets[0].data = newProductionData;
        chart.data.datasets[1].data = newConsumptionData;
        chart.update();
    }, 250);

    chart.options.plugins.zoom.zoom.onZoomComplete = function({ chart }) {
        const { min, max } = chart.scales.x;
        const diff = max - min;
        let newInterval = currentInterval;

        if (diff > 1000 * 60 * 60 * 24 * 365) {
            newInterval = 24 * 4 * 30; //month
            chart.options.scales.x.time.unit = 'month';
        } else if (diff > 1000 * 60 * 60 * 24 * 30) {
            newInterval = 24 * 4; //day
            chart.options.scales.x.time.unit = 'day';
        } else if (diff > 1000 * 60 * 60 * 24) {
            newInterval = 4; //hour
            chart.options.scales.x.time.unit = 'hour';
        } else {
            newInterval = 1; //15 minutes
            chart.options.scales.x.time.unit = 'minute';
        }

        if (newInterval !== currentInterval) {
            currentInterval = newInterval;
            const aggregatedProductionData = aggregateData(productionData, newInterval);
            const aggregatedConsumptionData = aggregateData(consumptionData, newInterval);
            updateChartData(aggregatedProductionData, aggregatedConsumptionData);
        } else {
            chart.update();
        }
    };

    // Add jump to date functionality
    const jumpToDateInput = document.getElementById('jumpToDate');
    const jumpToDateButton = document.getElementById('jumpToDateButton');

    function jumpToDate() {
        const selectedDate = moment(jumpToDateInput.value);
        if (selectedDate.isValid()) {
            const minDate = moment.min(productionData.concat(consumptionData).map(d => moment(d.x)));
            const maxDate = moment.max(productionData.concat(consumptionData).map(d => moment(d.x)));

            if (selectedDate >= minDate && selectedDate <= maxDate) {
                chart.scales.x.options.min = selectedDate.toDate();
                chart.scales.x.options.max = moment(selectedDate).add(1, 'month').toDate();
                chart.update();
            } else {
                alert('Selected date is outside the range of available data.');
            }
        } else {
            alert('Please enter a valid date.');
        }
    }

    jumpToDateButton.addEventListener('click', jumpToDate);
}

// Wait for the DOM to be fully loaded before creating the chart
document.addEventListener('DOMContentLoaded', createChart);

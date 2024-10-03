console.log('chart2.js script loaded');
async function fetchData() {
    const response = await fetch('http://localhost:3000/api/counterReadings/');
    if (!response.ok) {
        console.error("Failed to fetch data:", response.statusText);
        return []; // Return an empty array if the fetch fails
    }
    return await response.json();
}

function processData(rawData) {
    if (!Array.isArray(rawData) || rawData.length === 0) {
        console.error("No raw data available");
        return { productionData: [], consumptionData: [] }; // Return empty arrays if no data
    }
    return rawData.map(item => ({
        date: moment(item._id),
        consumptionHigh: item.consumptionHigh,
        consumptionLow: item.consumptionLow,
        productionHigh: item.productionHigh,
        productionLow: item.productionLow,
        totalConsumption: item.consumptionHigh + item.consumptionLow,
        totalProduction: item.productionHigh + item.productionLow
    })).sort((a, b) => a.date - b.date);
}

function aggregateData(data, interval) {
    const aggregated = [];
    for (let i = 0; i < data.length; i += interval) {
        const chunk = data.slice(i, i + interval);
        const avgData = {
            date: chunk[0].date,
            consumptionHigh: 0,
            consumptionLow: 0,
            productionHigh: 0,
            productionLow: 0,
            totalConsumption: 0,
            totalProduction: 0
        };
        chunk.forEach(item => {
            Object.keys(avgData).forEach(key => {
                if (key !== 'date') {
                    avgData[key] += item[key];
                }
            });
        });
        Object.keys(avgData).forEach(key => {
            if (key !== 'date') {
                avgData[key] /= chunk.length;
            }
        });
        aggregated.push(avgData);
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
    let processedData = processData(rawData);
    const ctx = document.getElementById('monthlyEnergyChart').getContext('2d');

    let currentInterval = 1;

    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            datasets: [
                {
                    label: 'Consumption High',
                    data: processedData,
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    parsing: {
                        xAxisKey: 'date',
                        yAxisKey: 'consumptionHigh'
                    },
                    stack: 'Consumption'
                },
                {
                    label: 'Consumption Low',
                    data: processedData,
                    backgroundColor: 'rgba(255, 159, 64, 0.5)',
                    parsing: {
                        xAxisKey: 'date',
                        yAxisKey: 'consumptionLow'
                    },
                    stack: 'Consumption'
                },
                {
                    label: 'Production High',
                    data: processedData,
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                    parsing: {
                        xAxisKey: 'date',
                        yAxisKey: 'productionHigh'
                    },
                    stack: 'Production'
                },
                {
                    label: 'Production Low',
                    data: processedData,
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    parsing: {
                        xAxisKey: 'date',
                        yAxisKey: 'productionLow'
                    },
                    stack: 'Production'
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'month',
                        displayFormats: {
                            month: 'MMM YYYY'
                        }
                    },
                    stacked: true
                },
                y: {
                    beginAtZero: true,
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Energy (kWh)'
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

    const updateChartData = debounce((newData) => {
        chart.data.datasets.forEach((dataset, index) => {
            dataset.data = newData;
        });
        chart.update();
    }, 250);

    chart.options.plugins.zoom.zoom.onZoomComplete = function({ chart }) {
        const { min, max } = chart.scales.x;
        const diff = max - min;
        let newInterval = currentInterval;

        if (diff > 1000 * 60 * 60 * 24 * 365 * 2) {
            newInterval = 12; // year
            chart.options.scales.x.time.unit = 'year';
        } else if (diff > 1000 * 60 * 60 * 24 * 365) {
            newInterval = 3; // quarter
            chart.options.scales.x.time.unit = 'quarter';
        } else {
            newInterval = 1; // month
            chart.options.scales.x.time.unit = 'month';
        }

        if (newInterval !== currentInterval) {
            currentInterval = newInterval;
            const aggregatedData = aggregateData(processedData, newInterval);
            updateChartData(aggregatedData);
        } else {
            chart.update();
        }
    };

    // Add jump to date functionality
    const jumpToDateInput = document.getElementById('jumpToDate2');
    const jumpToDateButton = document.getElementById('jumpToDateButton2');

    function jumpToDate() {
        const selectedDate = moment(jumpToDateInput.value);
        if (selectedDate.isValid()) {
            const minDate = moment(processedData[0].date);
            const maxDate = moment(processedData[processedData.length - 1].date);

            if (selectedDate >= minDate && selectedDate <= maxDate) {
                chart.scales.x.options.min = selectedDate.toDate();
                chart.scales.x.options.max = moment(selectedDate).add(1, 'year').toDate();
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
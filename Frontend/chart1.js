let chart1; // Global variable to hold the chart instance

function parseDate1(dateString) {
    return moment(dateString);
}

async function fetchData1() {
    console.log("fetchData function called for chart1");
    try {
        const response = await fetch('http://localhost:3000/api/entries');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Data fetched for chart1:", data);
        return data;
    } catch (error) {
        console.error("Error in fetchData for chart1:", error);
        return [];
    }
}

function processData1(rawData) {
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

        const baseDate = parseDate1(entry._id);
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

async function createChart1() {
    console.log("createChart1 function called");

    if (chart1) {
        chart1.destroy();
        console.log('Existing chart1 destroyed');
    }

    try {
        const rawData = await fetchData1();
        let { productionData , consumptionData} = await processData1(rawData);
        console.log(consumptionData, rawData)

        const ctx = document.getElementById('gainLossChart');
        if (!ctx) {
            console.error("Cannot find canvas element with id 'gainLossChart'");
            return;
        }

        if (consumptionData.length === 0) {
            console.error("No valid data to create chart1");
            ctx.innerHTML = "No data available to display chart1.";
            return;
        }

        chart1 = new Chart(ctx, {
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

        const jumpToDateInput = document.getElementById('jumpToDate');
        const jumpToDateButton = document.getElementById('jumpToDateButton');

        function jumpToDate1() {
            const selectedDate = moment(jumpToDateInput.value);
            if (selectedDate.isValid()) {
                const minDate = moment.min(consumptionData.map(d => moment(d.x)));
                const maxDate = moment.max(consumptionData.map(d => moment(d.x)));

                if (selectedDate >= minDate && selectedDate <= maxDate) {
                    chart1.scales.x.options.min = selectedDate.toDate();
                    chart1.scales.x.options.max = moment(selectedDate).add(1, 'day').toDate();
                    chart1.update();
                } else {
                    alert('Selected date is outside the range of available data.');
                }
            } else {
                alert('Please enter a valid date.');
            }
        }

        jumpToDateButton.addEventListener('click', jumpToDate1);

        console.log('Chart1 created successfully');
    } catch (error) {
        console.error("Error in createChart for chart1:", error);
    }
}

// Wait for the DOM to be fully loaded before creating the chart
document.addEventListener('DOMContentLoaded', createChart1);
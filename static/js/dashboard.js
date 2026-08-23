document.addEventListener("DOMContentLoaded", function () {

    // -----------------------------------------
    // GET RAW CUSTOMER DATA FROM FLASK
    // -----------------------------------------

    const dashboardData = window.dashboardData;

    if (!dashboardData || dashboardData.length === 0) {
        console.error("Dashboard data not found.");
        return;
    }

    console.log("Dashboard data loaded:", dashboardData.length);


    // -----------------------------------------
    // CHART REFERENCES
    // -----------------------------------------

    let churnChart;
    let contractChart;
    let internetChart;
    let tenureChart;


    // -----------------------------------------
    // FILTER ELEMENTS
    // -----------------------------------------

    const contractFilter = document.getElementById("contractFilter");
    const internetFilter = document.getElementById("internetFilter");
    const genderFilter = document.getElementById("genderFilter");


    // -----------------------------------------
    // FILTER DATA
    // -----------------------------------------

    function getFilteredData() {

        const selectedContract = contractFilter.value;
        const selectedInternet = internetFilter.value;
        const selectedGender = genderFilter.value;

        return dashboardData.filter(customer => {

            const contractMatch =
                selectedContract === "All" ||
                customer["Contract"] === selectedContract;

            const internetMatch =
                selectedInternet === "All" ||
                customer["Internet Service"] === selectedInternet;

            const genderMatch =
                selectedGender === "All" ||
                customer["Gender"] === selectedGender;

            return contractMatch && internetMatch && genderMatch;
        });
    }


    // -----------------------------------------
    // CALCULATE TENURE GROUP
    // -----------------------------------------

    function getTenureGroup(tenure) {

        tenure = Number(tenure);

        if (tenure <= 12) {
            return "0-12 Months";
        } else if (tenure <= 24) {
            return "13-24 Months";
        } else if (tenure <= 36) {
            return "25-36 Months";
        } else if (tenure <= 48) {
            return "37-48 Months";
        } else if (tenure <= 60) {
            return "49-60 Months";
        } else {
            return "61-72 Months";
        }
    }


    // -----------------------------------------
    // UPDATE ALL CHARTS
    // -----------------------------------------

    function updateDashboard() {

        const filteredData = getFilteredData();

        console.log(
            "Filtered customers:",
            filteredData.length
        );


        // -------------------------------------
        // CHURN COUNTS
        // -------------------------------------

        const churned = filteredData.filter(
            customer => Number(customer["churn"]) === 1
        ).length;

        const retained = filteredData.length - churned;


        // -------------------------------------
        // UPDATE KPI CARDS
        // -------------------------------------

        const total = filteredData.length;

        const churnRate = total > 0
            ? ((churned / total) * 100).toFixed(2)
            : "0.00";


        const totalElement =
            document.querySelector(".kpi-total");

        const churnedElement =
            document.querySelector(".kpi-churned");

        const retainedElement =
            document.querySelector(".kpi-retained");

        const rateElement =
            document.querySelector(".kpi-rate");


        if (totalElement) {
            totalElement.textContent = total;
        }

        if (churnedElement) {
            churnedElement.textContent = churned;
        }

        if (retainedElement) {
            retainedElement.textContent = retained;
        }

        if (rateElement) {
            rateElement.textContent = churnRate + "%";
        }


        // -------------------------------------
        // 1. CUSTOMER CHURN DISTRIBUTION
        // -------------------------------------

        churnChart.data.datasets[0].data = [
            retained,
            churned
        ];

        churnChart.update();


        // -------------------------------------
        // 2. CHURN BY CONTRACT
        // -------------------------------------

        const contracts = [
            "Month-to-month",
            "One year",
            "Two year"
        ];

        const contractValues = contracts.map(contract => {

            const contractCustomers = filteredData.filter(
                customer => customer["Contract"] === contract
            );

            if (contractCustomers.length === 0) {
                return 0;
            }

            const contractChurned = contractCustomers.filter(
                customer => Number(customer["churn"]) === 1
            ).length;

            return Number(
                ((contractChurned / contractCustomers.length) * 100)
                    .toFixed(2)
            );
        });


        contractChart.data.labels = contracts;

        contractChart.data.datasets[0].data =
            contractValues;

        contractChart.update();


        // -------------------------------------
        // 3. CHURN BY INTERNET SERVICE
        // -------------------------------------

        const internetServices = [
            "DSL",
            "Fiber optic",
            "No"
        ];

        const internetValues = internetServices.map(service => {

            const serviceCustomers = filteredData.filter(
                customer => customer["Internet Service"] === service
            );

            if (serviceCustomers.length === 0) {
                return 0;
            }

            const serviceChurned = serviceCustomers.filter(
                customer => Number(customer["churn"]) === 1
            ).length;

            return Number(
                ((serviceChurned / serviceCustomers.length) * 100)
                    .toFixed(2)
            );
        });


        internetChart.data.labels =
            internetServices;

        internetChart.data.datasets[0].data =
            internetValues;

        internetChart.update();


        // -------------------------------------
        // 4. TENURE DISTRIBUTION
        // -------------------------------------

        const tenureGroups = [
            "0-12 Months",
            "13-24 Months",
            "25-36 Months",
            "37-48 Months",
            "49-60 Months",
            "61-72 Months"
        ];

        const tenureValues = tenureGroups.map(group => {

            return filteredData.filter(customer => {

                return getTenureGroup(
                    customer["Tenure Months"]
                ) === group;

            }).length;

        });


        tenureChart.data.labels =
            tenureGroups;

        tenureChart.data.datasets[0].data =
            tenureValues;

        tenureChart.update();
    }


    // -----------------------------------------
    // CREATE CHARTS
    // -----------------------------------------

    churnChart = new Chart(
        document.getElementById("churnChart"),
        {
            type: "doughnut",

            data: {
                labels: [
                    "Retained",
                    "Churned"
                ],

                datasets: [{
                    data: [0, 0],

                    backgroundColor: [
                        "#22c55e",
                        "#ef4444"
                    ],

                    borderWidth: 0
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                plugins: {
                    legend: {
                        position: "bottom"
                    }
                }
            }
        }
    );


    contractChart = new Chart(
        document.getElementById("contractChart"),
        {
            type: "bar",

            data: {
                labels: [],

                datasets: [{
                    label: "Churn Rate (%)",

                    data: [],

                    backgroundColor: "#2563eb",

                    borderRadius: 6
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                },

                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        }
    );


    internetChart = new Chart(
        document.getElementById("internetChart"),
        {
            type: "bar",

            data: {
                labels: [],

                datasets: [{
                    label: "Churn Rate (%)",

                    data: [],

                    backgroundColor: "#f59e0b",

                    borderRadius: 6
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                },

                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        }
    );


    tenureChart = new Chart(
        document.getElementById("tenureChart"),
        {
            type: "bar",

            data: {
                labels: [],

                datasets: [{
                    label: "Customers",

                    data: [],

                    backgroundColor: "#7c3aed",

                    borderRadius: 6
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                plugins: {
                    legend: {
                        display: false
                    }
                },

                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        }
    );


    // -----------------------------------------
    // FILTER EVENT LISTENERS
    // -----------------------------------------

    contractFilter.addEventListener(
        "change",
        updateDashboard
    );

    internetFilter.addEventListener(
        "change",
        updateDashboard
    );

    genderFilter.addEventListener(
        "change",
        updateDashboard
    );


    // -----------------------------------------
    // RESET FILTERS
    // -----------------------------------------

    window.resetFilters = function () {

        contractFilter.value = "All";

        internetFilter.value = "All";

        genderFilter.value = "All";

        updateDashboard();
    };


    // -----------------------------------------
    // INITIAL DASHBOARD LOAD
    // -----------------------------------------

    updateDashboard();

});
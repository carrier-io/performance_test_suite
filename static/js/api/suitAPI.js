const ApiFetchBETests = async () => {
    const res = await fetch(`/api/v1/backend_performance/tests/${getSelectedProjectId()}`, {
        method: 'GET',
    })
    return res.json();
}

const ApiFetchUITests = async () => {
    const res = await fetch(`/api/v1/ui_performance/tests/${getSelectedProjectId()}`, {
        method: 'GET',
    })
    return res.json();
}

const ApiFetchSuits = async () => {
    const res = await fetch(`/api/v1/performance_test_suite/suite/${getSelectedProjectId()}`, {
        method: 'GET',
    })
    return res.json();
}

const ApiCreateSuits = async (suit) => {
    const res = await fetch(`/api/v1/performance_test_suite/suite/${getSelectedProjectId()}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(suit)
    })
    return res.json();
}

const ApiUpdateSuits = async (suit, id) => {
    const res = await fetch(`/api/v1/performance_test_suite/suite/${getSelectedProjectId()}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(suit)
    })
    return res.json();
}

const ApiDeleteSuit = async (ids) => {
    const params = new URLSearchParams();
    params.append('id[]', ids.join(','));
    const res = await fetch(`/api/v1/performance_test_suite/suite/${getSelectedProjectId()}/?${params}`, {
        method: 'DELETE',
    })
    return true;
}

const ApiRunSuit = async (suit, id) => {
    const res = await fetch(`/api/v1/performance_test_suite/suites/${getSelectedProjectId()}/${id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(suit)
    })
    return res.json();
}

const ApiDeleteReport = async (ids) => {
    const params = new URLSearchParams();
    params.append('id[]', ids.join(','));
    const res = await fetch(`/api/v1/performance_test_suite/reports/${getSelectedProjectId()}/?${params}`, {
        method: 'DELETE',
    })
    return res.json();
}

const ApiChartData = async (reportId, aggregationType = 'auto') => {
    const res = await fetch(`/api/v1/performance_test_suite/chart/${getSelectedProjectId()}/${reportId}?aggregation=${aggregationType}`, {
        method: 'GET',
    })
    return res.json();
}
const ApiSummaryData = async (reportId) => {
    const res = await fetch(`/api/v1/performance_test_suite/summary_tables/${getSelectedProjectId()}/${reportId}`, {
        method: 'GET',
    })
    return res.json();
}
const ApiChartTimeData = async (reportId) => {
    const res = await fetch(`/api/v1/performance_test_suite/summary_charts/${getSelectedProjectId()}/${reportId}`, {
        method: 'GET',
    })
    return res.json();
}
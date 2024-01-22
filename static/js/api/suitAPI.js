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
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
import fetch from 'cross-fetch'

import { notifySuccess, notifyError } from '../notifications/actions.js'

export const UPDATED_IPS = 'UPDATED_IPS'

export function updatedIPs(message, current_project_uuid) {
	return {
		type: UPDATED_IPS,
		current_project_uuid: current_project_uuid,
		message
	}
}

////// 

import { fetchCredsForIPs } from '../creds/actions.js'


export const RECEIVE_IPS = 'RECEIVE_IPS'
export function receiveIPs(message) {
	return { type: RECEIVE_IPS, message }
}


export function requestSingleIP(project_uuid, ip_address) {
	return dispatch => {
		dispatch(setLoadingIPs(true));
		dispatch(fetchSingleIP(project_uuid, ip_address)).then(() => {
			dispatch(setLoadingIPs(false));
			dispatch(fetchFilesStatsIPs());
		});
	}
}

export function fetchSingleIP(project_uuid, ip_address) {
	return dispatch =>
		fetch(`/project/${project_uuid}/ip/get/${ip_address}`)
			.then(
				response => response.json(),
				error => console.log(error)
			)
			.then(
				json => dispatch(receiveIPs(json))
			)
}


export const FLUSH_IPS = 'FLUSH_IPS'
export function flushIPs(isLoading) {
	return { type: FLUSH_IPS, isLoading }
}

export function flushAndRequestIPs(project_uuid, filters={}, ip_page=0, ip_page_size=12) {
	return dispatch => {
		dispatch(flushIPs());
		dispatch(requestIPs(project_uuid, filters, ip_page, ip_page_size));
	}
}


import { fetchFilesStatsIPs } from '../files/actions.js'

export function requestIPs(project_uuid, filters={}, ip_page=0, ip_page_size=12) {
	const params = {
		filters: filters,
		ip_page: ip_page,
		ip_page_size: ip_page_size,
	}

	return dispatch => {
		dispatch(setLoadingIPs(true));
		dispatch(fetchIPs(project_uuid, params)).then(() => {
			dispatch(fetchTasksForShownIPs());
			dispatch(setLoadingIPs(false));
			dispatch(fetchCredsForIPs());
			dispatch(fetchFilesStatsIPs());
		});
	}
}


export const SET_LOADING_IPS = 'SET_LOADING_IPS'
export function setLoadingIPs(isLoading) {
	return { type: SET_LOADING_IPS, isLoading }
}

export function fetchIPs(project_uuid, params) {
	const filters = encodeURIComponent(JSON.stringify(params['filters']));

	const queryFields = [
		`filters=${filters}`,
		`ip_page=${params['ip_page']}`,
		`ip_page_size=${params['ip_page_size']}`,
	];

	const query = queryFields.join('&');

	return dispatch =>
		fetch(`/project/${project_uuid}/ips?${query}`)
			.then(
				response => response.json(),
				error => console.log(error)
			)
			.then(
				json => dispatch(receiveIPs(json))
			)
}


export function requestUpdateIPComment(project_uuid, ip_id, comment) {
	return dispatch =>
	fetch(`/project/${project_uuid}/ip/update/${ip_id}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			comment: comment
		})
	})
		.then(
			response => response.json().then(json => ({
				status: response.status,
				json
			}))
		)
		.then(
			({ status, json }) => {
				if (status == 200) {
					dispatch(notifySuccess("IP comment updated"));
				}
				else {
					dispatch(notifyError("Error updating IP comment " + json.message));
				}
			}
		)
}

export function requestDelteIP(project_uuid, ip_id) {
	return dispatch =>
		fetch(`/project/${project_uuid}/ip/delete`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				ip_id: ip_id
			})
		})
			.then(
				response => response.json(),
				error => console.log(error)
			)
			.then(
				json => dispatch(renewIPsCurrentPage())
			)
}


export function renewIPsCurrentPage() {
	return (dispatch, getState) => {
		const { project_uuid, ips } = getState();

		dispatch(flushIPs());
		dispatch(requestIPs(project_uuid, ips.filters, ips.page, ips.page_size));
	}
}


export function IPsCreated(message) {
	return (dispatch, getState) => {
		const { project_uuid } = getState();

		if (project_uuid == message.project_uuid) {
			dispatch(renewIPsCurrentPage());
		}
	}
}


export function IPDeleted(message) {
	return (dispatch, getState) => {
		const { project_uuid, ips } = getState();

		dispatch(requestIPs(project_uuid, ips.filters, ips.page, ips.page_size));
	}
}

export const SET_IPS_FILTERS = 'SET_IPS_FILTERS'

export function setIPsFilters(filters) {
	return {
		type: SET_IPS_FILTERS,
		filters
	}
}


export const IP_COMMENT_UPDATED = 'IP_COMMENT_UPDATED'

export function IPCommentUpdated(message, current_project_uuid) {
	return {
		type: IP_COMMENT_UPDATED,
		current_project_uuid: current_project_uuid,
		message
	}
}


export function fetchTasksForShownIPs() {
	return (dispatch, getState) => {
		const { ips, project_uuid } = getState();
		const ip_addresses = ips.data.map((ip) => ip.ip_address);

		fetch(`/project/${project_uuid}/ips/tasks`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				ips: ip_addresses
			})
		})
		.then(
			response => response.json().then(json => ({
				status: response.status,
				json
			}))
		)
		.then(
			({ status, json }) => {
				if (status == 200) {
					dispatch(receiveTasksForIPs(json));
				}
				else {
					dispatch(notifyError("Error while fetching tasks for ips. " + json.message));
				}
			}
		)
	}
}

export const RECEIVE_TASKS_FOR_IPS = 'RECEIVE_TASKS_FOR_IPS'

export function receiveTasksForIPs(tasks) {
	return {
		type: RECEIVE_TASKS_FOR_IPS,
		tasks
	}
}


// This is fired when ips have received some data updates on the server side
export function IPsDataUpdated(message, current_project_uuid) {
	return (dispatch, getState) => {
		const { project_uuid, ips } = getState();

		// By this check we make sure that this notification is indeed us
		if (current_project_uuid == project_uuid) {
			var found = false;
		
			if (message.updated_ips) {
				for (let each_ip_address of message.updated_ips) {
					for (let state_ip of ips.data) {
						if (state_ip.ip_address == each_ip_address) {
							found = true;
							break;
						}
					}
					if (found) break;
				}
			}

			if (found) {
				dispatch(renewIPsCurrentPage());
			}
		}
	}
}


export function requestExportIPs() {
	return (dispatch, getState) => {
		const { project_uuid, ips } = getState();
		console.log(1234);
		fetch(`/project/${project_uuid}/ips/export`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				filters: ips.filters
			})
		})
		.then(
			response => response.blob().then(blob => ({
				status: response.status,
				blob
			}))
		)
		.then(
			({ status, blob }) => {
				if (status == 200) {
					let url = window.URL.createObjectURL(blob);
					let aTag = document.createElement('a');
					aTag.href = url;
					aTag.download = "nmap-tcp.txt";
					document.body.appendChild(aTag); // we need to append the element to the dom -> otherwise it will not work in firefox
					aTag.click();    
					aTag.remove();  //afterwards we remove the element again  
				}
				else {
					dispatch(notifyError("Error while exporting ips. " + blob));
				}
			}
		)
	}
}
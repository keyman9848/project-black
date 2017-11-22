import _ from 'lodash'
import React from 'react'
import Notifications from 'react-notification-system-redux'

import ReactPaginate from '../../common/paginate/ReactPaginate.jsx'
import ScopesSocketioEventsEmitter from '../../redux/scopes/ScopesSocketioEventsEmitter.js'
import IPEntryLine from '../presentational/scope/IPEntryLine.jsx'
import Search from './Search.jsx'

import { Card } from 'semantic-ui-react'


class IPTable extends React.Component {

	constructor(props) {
		super(props);

		if (this.props.ips) {
			this.state = {
				shownData: this.props.ips.data,
				offsetPage: this.props.ips.page,
				pageCount: Math.ceil(this.props.ips.total_db_ips / this.props.ips.page_size)
			}
		}

		this.scopesEmitter = new ScopesSocketioEventsEmitter();

		this.commentSubmitted = this.commentSubmitted.bind(this);
		this.handlePageClick = this.handlePageClick.bind(this);

		this.page_inited = false;
	}

	commentSubmitted(comment, _id) {
		this.scopesEmitter.requestUpdateComment(comment, _id, this.props.project_uuid);
	}

	shouldComponentUpdate(nextProps, nextState) {
		if (!_.isEqual(nextProps, this.props) || !_.isEqual(this.state, nextState)) {
			if (this.props.ips.length !== nextProps.ips.length) {
				var diff = nextProps.ips.length - this.props.ips.length;

				if (diff > 0) {
					this.context.store.dispatch(Notifications.info({
						title: 'New IPs',
						message: 'Added ' + String(nextProps.ips.length - this.props.ips.length) + ' IPs.'
					}));					
				}
				else {
					this.context.store.dispatch(Notifications.info({
						title: 'IPs deleted',
						message: 'Deleted ' + String(this.props.ips.length - nextProps.ips.length) + ' IPs.'
					}));					
				}

			}

			return true;
		}
		else {
			return false;
		}
	}

	componentWillReceiveProps(nextProps) {
		if ((nextProps.ips.page !== this.props.ips.page) || (nextProps.ips.page_size !== this.props.ips.page_size)) {
			this.props.setLoading(false);
		}

		var start = this.limitPerPage * this.state.offsetPage;

		this.setState({
			shownData: nextProps.ips.data,
			pageCount: Math.ceil(this.props.ips.total_db_ips / this.props.ips.page_size)
		});
	}

	handlePageClick(page_number) {
		this.scopesEmitter.requestRenewScopes(this.props.project_uuid, page_number-1);
		this.props.setLoading(true);
	}

	render() {
		const ips = _.map(this.state.shownData, (x) => {
			return <IPEntryLine key={x.ip_id} 
								ip={x}
								project_uuid={this.props.project_uuid}
								onCommentSubmit={(value) => this.commentSubmitted(value, x._id)}
								deleteScope={() => this.props.deleteScope(x._id)} />
		});

		return (
			<div>
				<Search onFilterChange={this.props.onFilterChange} />
				<br />
				<Card.Group>
					{ips}
				</Card.Group>
				<br />
				<ReactPaginate pageCount={this.state.pageCount}
							   clickHandler={this.handlePageClick} />
			</div>
		)
	}
}

IPTable.contextTypes = {
	store: React.PropTypes.object
}

export default IPTable;

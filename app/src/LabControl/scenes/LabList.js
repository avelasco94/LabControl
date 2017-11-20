import React, { Component } from 'react';
import { 
	Navigator, 
	Text,
	View,
	TextInput,	
	ListView,
	FlatList,
	StyleSheet,
	RefreshControl,
} from 'react-native';

import { 
	COLOR, 
	ThemeProvider,
	Buttresponse,
	ListItem,
	Toolbar,
} from 'react-native-material-ui';

import { NavigationActions } from 'react-navigation';
import Snackbar from 'react-native-snackbar';

let SharedPreferences = require('react-native-shared-preferences');

const resetAction = NavigationActions.reset({
	index: 0,
	actions: [
		NavigationActions.navigate({ routeName: 'Main'  }),
	],
});

function search(name, arr){
	for (var i = 0; i < arr.length; i++) {
		if (arr[i].roomname == name) {
			return arr[i];
		}	
	}
}

let server, token; 

export default class LabList extends Component{
	constructor(props){
		super(props);

		this.state = {
			rooms : [],
			refreshing: false,			
		};
	}

	_fetchMyRooms(url){
		return fetch(url, {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				token: token,
			}),
		})
		.then((response) => response.json())
		.then((responseJson) => {
			if (responseJson.success) {
				let newrooms = responseJson.rooms.map((x) => {
					return x.roomname;
				});

				this.setState({ rooms: responseJson.rooms });
			}else{
				Snackbar.show({ title: responseJson.message });
			}	
		})
		.catch((error) => {
			Snackbar.show({ title: error.toString() + '. Try to refresh list' });
		});
	}

	componentWillMount(){
		SharedPreferences.getItem('server', (value) => {
			server = value; 
		});

		SharedPreferences.getItem('auth_token', (value) => {
			token = value;
		});

		this._onRefresh();
	}	

	render(){
		const { dispatch } = this.props.navigation;

		return (
			<View style={styles.mainContainer}>
				<Toolbar 
					centerElement="Laboratorios"	
					rightElement='exit-to-app' //more-vert is another option
					onRightElementPress={() => {
						SharedPreferences.removeItem('auth_token');			
						dispatch(resetAction);
					}}
				/>	
				<View style={styles.listContainer}>
					<FlatList 
						refreshControl={
							<RefreshControl
								refreshing={this.state.refreshing}
								onRefresh={this._onRefresh.bind(this)}
							/>
						}
						data = {this.state.rooms}
						keyExtractor={ (item, index) => index }
						renderItem = { 
							( rowData ) => {
								let room = search(rowData.item.roomname, this.state.rooms);

								//to change condition
								if (room.status == 0) {
									return <ListItem 
										centerElement={room.roomname} 
										rightElement='lock'
										divider={true}
										onPress={this._listItemPress.bind(this, room)}
									/>			
								}else if (room.status == 1){
									return <ListItem 
										centerElement={room.roomname} 
										rightElement='lock-open'
										divider={true}
										onPress={this._listItemPress.bind(this, room)}
									/>
								}else{
									return <ListItem 
										centerElement={room.roomname} 
										rightElement='do-not-disturb-on'
										divider={true}
										onPress={this._listItemPress.bind(this, room)}
									/>
								}
							}
						}
					/>
				</View>
			</View>
		);
	}

	_onRefresh(){
		this.setState({refreshing: true});	

		//fetch function here
		this._fetchMyRooms('http://' + server + ':8080/api/fetch_my_rooms/')
		.then(this.setState({ refreshing: false }));
	}

	_listItemPress(data){
		const { navigate } = this.props.navigation;
		
		navigate('LabDetail', {
			room: data,
		});
	}
}

const styles = StyleSheet.create({
	mainContainer: {
		flex: 1,
	},
	listContainer: {
		flex: 1,
		justifyContent: 'center',
	},
});

import Vue from "vue"
import Vuex from "vuex"
import Vuetify from "@/plugins/vuetify"

import icons from "@/assets/icons.json"

import axios from "axios";
import { eventBus } from "../main";
import { validate as isValidUUID } from 'uuid';

const ax = axios.create({
	baseURL: process.env.BASE_URL,
});

Vue.use(Vuex)

export default new Vuex.Store({
	state: {
		route: null,
		global: {
			scenes: {
				mainScenes: {
					url: "data/json/scenes.json",
					data: null,
					set: false,
				},
				subScenes: {
					url: "data/json/subScenes.json",
					data: null,
					set: false,
				},
			},
			galleries: {
				url: "data/json/galleries.json",
				data: null,
			},
			waterLevels: null,
			bottomHeight: null,
			tabItemsHeight: null,
			drawerRightWidth: null,
			drawerLeft: false,
			contentDrawer: false,
			actionBounds: true,
			actionBoundsRadius: 50,
		},
		map: {
			title: null,
			currentUUID: null,
			nextID: null,
			isSubscene: null,
			activeLayers: [{ "name": "route" }, { "name": "scenes" }],
			icons: icons.icons,
			colSliderStart: null,
			colEventPoint: null
		},
		JSONLayers: {
			route: {
				url: 'data/json/route.json',
				data: null,
			},
			speicherXI: {
				url: 'data/json/speicherXI.json',
				data: null,
			},
			colonies: {
				url: 'data/json/countries.json',
				data: null,
			},
			cotton: {
				url: 'data/json/cotton.json',
				data: null,
			},
			coffeeBremen: {
				url: 'data/json/coffeeBremen.json',
				data: null,
			},
			coffeeWorld: {
				url: 'data/json/coffeeWorld.json',
				data: null,
			},
			streets: {
				url: 'data/json/streets.json',
				data: null,
			},
			ports: {
				url: 'data/json/ports.json',
				data: null,
			},
			river: {
				url: 'data/json/river.json',
				data: null,
			},
		},
		content: {
			object: null,
			tabs: {},
			currentItem: {},
			currentAudioID: null,
			audio: {
				isPlaying: false,
			},
			audios: {}
		}
	},
	actions: {
		async fetchScenes({ dispatch }) {
			// Use Object.entries to iterate through the data object
			const requests = Object.entries(this.state.global.scenes).map(([key, value]) => {
				const url = value.url;
				// Dispatch Axios requests for each entry
				return dispatch('fetchData', { key, url });
			});

			// Wait for all Axios requests to complete
			await Promise.all(requests)

			if (isValidUUID(this.state.route.params.uuid))
				eventBus.$emit('openScene', this.state.route.params.uuid)
		},
		async fetchData({ commit }, { key, url }) {
			try {
				const response = await ax.get(url);
				// Handle the response as needed, e.g., commit to mutations
				const fc = response.data
				commit('setScenes', { key, fc });
			} catch (error) {
				// Handle errors here
				console.error(`Error fetching data for ${key}: ${error.message}`);
			}
		},
		fetchGalleries(context) {
			ax.get(context.state.global.galleries.url)
				.then(response => response.data)
				.then(galleries => {
					context.commit("setGalleries", galleries)
				})
				.catch((err) => {
					console.log(err);
				});
		},
		fetchWeserWaterLevels({ commit }) {
			ax.get('https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations.json?waters=WESER&includeTimeseries=true&includeCurrentMeasurement=true')
				.then(response => {
					commit('setWeserWaterLevels', response.data)
				})
		},
		async fetchJSONLayers({ commit }) {
			try {
				const requests = [];

				for (let key in this.state.JSONLayers) {
					const response = await ax.get(this.state.JSONLayers[key].url);
					const fc = response.data
					commit('setJSONLayers', {key, fc});
					requests.push(response);
				}

				// Wait for all Axios requests to complete
				await Promise.all(requests);

			} catch (error) {
				// Handle errors here
				console.error('Error fetching JSONLayers:', error);
			}
		},
		bottomHeight(context, payload) {
			context.commit("bottomHeight", payload)
		},
		drawerRightWidth(context, payload) {
			context.commit("drawerRightWidth", payload)
		},
		toggleDrawerLeft(context, payload) {
			context.commit("toggleDrawerLeft", payload)
		},
		toggleContentDrawer(context, payload) {
			context.commit("toggleContentDrawer", payload)
		},
		// * Map Actions
		updateState(context, payload) {
			context.commit("updateState", payload)
		},
		colSliderStart(context, payload) {
			context.commit("colSliderStart", payload)
		},
		colEventPoint(context, payload) {
			context.commit("colEventPoint", payload)
		},
		// Content Actions
		addCompleted(context, payload) {
			context.commit("addCompleted", payload)
		},
		addVisited(context, payload) {
			context.commit("addVisited", payload)
		},
		saveTabsState(context, payload) {
			context.commit("saveTabsState", payload)
		},
		updateContentItem(context, payload) {
			context.commit("updateContentItem", payload)
		},
		updatePlayingState(context, payload) {
			context.commit("updatePlayingState", payload)
		},
		saveAudioState(context, payload) {
			context.commit("saveAudioState", payload)
		}
	},
	mutations: {
		setRoute(state, route) {
			state.route = route;
		},
		// * Global Mutations
		setScenes: (state, payload) => {
			state.global.scenes[payload.key].data = payload.fc
			state.global.scenes[payload.key].set = true
		},
		setGalleries: (state, payload) => {
			state.global.galleries.data = payload
		},
		setJSONLayers: (state, payload) => {
			state.JSONLayers[payload.key].data = payload.fc
		},
		setWeserWaterLevels: (state, data) => {
			const features = data.filter((feature) =>
				feature.agency === "BREMEN" &&
				feature.km < 40 &&
				feature.latitude !== undefined &&
				feature.timeseries[0].shortname === "W" ||
				feature.agency === "BREMERHAVEN" &&
				feature.latitude !== undefined &&
				feature.timeseries[0].shortname === "W" &&
				feature.shortname !== "DWARSGAT" &&
				feature.shortname !== "ROBBENSÜDSTEERT" &&
				feature.shortname !== "LEUCHTTURM ALTE WESER")
			let jsonObj = {
				type: "FeatureCollection",
				features: []
			}
			for (let i = 0; i < features.length; i++) {
				// Capitalize first Letter of each Word in Name
				const name = features[i].longname.toLowerCase()
				const words = name.split(" ")
				for (let j = 0; j < words.length; j++) {
					words[j] = words[j][0].toUpperCase() + words[j].substr(1)
				}
				const nameCapitalized = words.join(" ")
				// Single out currentMeasurement
				const currentMeasurement = features[i].timeseries[0].currentMeasurement
				// Convert Timestamp to Hours and Minutes
				const timestamp = new Date(currentMeasurement.timestamp)
				let measuredHours = timestamp.getHours()
				measuredHours = ("0" + measuredHours).slice(-2)
				let measuredMinutes = timestamp.getMinutes()
				measuredMinutes = ("0" + measuredMinutes).slice(-2)

				const item = {
					type: "Feature",
					properties: {
						uuid: features[i].uuid,
						name: nameCapitalized,
						timestamp: {
							hours: measuredHours,
							minutes: measuredMinutes,
						},
						value: currentMeasurement.value / 100
					},
					geometry: {
						coordinates: [
							parseFloat(features[i].longitude),
							parseFloat(features[i].latitude)
						],
						type: "Point"
					}
				}
				jsonObj.features.push(item)
			}
			state.global.waterLevels = jsonObj
		},
		bottomHeight: (state, payload) => {
			state.global.bottomHeight = payload
		},
		tabItemsHeight: (state, payload) => {
			state.global.tabItemsHeight = payload
		},
		drawerRightWidth: (state, payload) => {
			state.global.drawerRightWidth = payload
		},
		toggleDrawerLeft: (state, payload) => {
			if (state.global.drawerLeft !== payload) {
				state.global.drawerLeft = !state.global.drawerLeft
			}
		},
		toggleContentDrawer: (state, payload) => {
			if (state.global.contentDrawer !== payload) {
				state.global.contentDrawer = !state.global.contentDrawer
			}
		},
		// * Map Mutations
		updateState: (state, payload) => {
			if (payload.uuid) {
				state.map.currentUUID = payload.uuid
			}
			if (payload.nextID) {
				state.map.nextID = payload.nextID
			}
			if (payload.title) {
				state.map.title = payload.title
			}
			if (payload.layers) {
				state.map.activeLayers = payload.layers
			}
			if (payload.isSubscene) {
				state.map.isSubscene = payload.isSubscene
			}
			if (payload.content) {
				state.content.object = payload.content
			}
			if (!state.content.tabs[payload.uuid]) {
				state.content.tabs[payload.uuid] = {
					visited: new Set(),
					active: null,
					pinned: 0,
					completed: []
				}
			}
			if (!state.content.audios[payload.uuid]) {
				let audios = state.content.object.resources.filter(a => a.type === 'audio');
				state.content.audios[payload.uuid] = {}
				for (let i = 0; i < audios.length; i++) {
					state.content.audios[payload.uuid][audios[i].id] = {
						localSrc: null,
						localProgress: null,
						duration: 0,
						progress: 0,
						currentTime: 0,
					}
				}
			}
			// state.app.title = payload.title
		},
		colSliderStart: (state, payload) => {
			state.map.colSliderStart = payload
		},
		colEventPoint: (state, payload) => {
			state.map.colEventPoint = payload
		},
		// Content Mutations
		addCompleted: (state, payload) => {
			const completed = state.content.tabs[state.map.currentUUID].completed
			if (Number.isInteger(payload)) {
				if (!completed.includes(payload)) {
					state.content.tabs[state.map.currentUUID].completed.push(payload)
				}
			}
			eventBus.$emit("newCompleted")
		},
		addVisited: (state, payload) => {
			state.content.tabs[state.map.currentUUID].visited.add(payload)
		},
		saveTabsState: (state, payload) => {
			state.content.tabs[state.map.currentUUID].active = payload.active
			state.content.tabs[state.map.currentUUID].pinned = payload.pinned
		},
		updateContentItem: (state, payload) => {
			state.content.currentItem = payload
			// Store last opend audio item separately
			if (payload.type === 'audio') {
				state.content.currentAudioID = payload.id
			}
		},
		updatePlayingState: (state, payload) => {
			state.content.audio.isPlaying = payload
		},
		saveAudioState: (state, payload) => {
			state.content.audios[state.map.currentUUID][payload.id] = payload
		}
	},
	getters: {
		// * Global Getters
		scenes: state => {
			return state.global.scenes.mainScenes.data
		},
		scenesIsSet: state => {
			return state.global.scenes.mainScenes.set
		},
		subScenes: state => {
			return state.global.scenes.subScenes.data
		},
		subScenesIsSet: state => {
			return state.global.scenes.subScenes.set
		},
		galleries: state => {
			return state.global.galleries.data
		},
		waterLevels: state => {
			return state.global.waterLevels
		},
		JSONLayers: state => {
			return state.JSONLayers
		},
		bottomHeight: state => {
			return state.global.bottomHeight
		},
		tabItemsHeight: state => {
			return state.global.tabItemsHeight
		},
		drawerRightWidth: state => {
			return state.global.drawerRightWidth
		},
		drawerLeft: state => {
			return state.global.drawerLeft
		},
		contentDrawer: state => {
			return state.global.contentDrawer
		},
		useActionBounds: state => {
			return state.global.actionBounds
		},
		actionBoundsRadius: state => {
			return state.global.actionBoundsRadius
		},
		colors: state => {
			if (state.global.darkMode) {
				return Vuetify.framework.theme.themes.dark
			} else {
				return Vuetify.framework.theme.themes.light
			}
		},
		// * Map Getters
		activeLayers: state => {
			return state.map.activeLayers
		},
		markerIcons: state => {
			return state.map.icons
		},
		currentUUID: state => {
			return state.map.currentUUID
		},
		nextID: state => {
			return state.map.nextID
		},
		isSubscene: state => {
			return state.map.isSubscene
		},
		noOfScenes: state => {
			return state.global.scenes.mainScenes.data.features.length
		},
		colSliderStart: state => {
			return state.map.colSliderStart
		},
		colEventPoint: state => {
			return state.map.colEventPoint
		},
		// * Content Getters
		content: state => {
			if (state.content.object) {
				return state.content.object
			}
			else {
				return false
			}
		},
		resources: state => {
			if (state.content.object) {
				const resources = state.content.object.resources

				// for each type return corresponding icon
				const icons = {
					"audio": "mdi-headphones",
					"map": "mdi-map",
					"gallery": "mdi-view-carousel",
					"timeline": "mdi-play-box-outline"
				}
				for (let value of Object.values(resources)) {
					value["icon"] = icons[value.type]
				}
				return resources
			}
			else {
				return false
			}
		},
		currentItem: state => {
			return state.content.currentItem
		},
		currentAudioID: state => {
			return state.content.currentAudioID
		},
		completed: state => {
			return state.content.tabs[state.map.currentUUID].completed
		},
		tabs: state => {
			return state.content.tabs
		},
		activeTab: state => {
			return state.content.tabs[state.map.currentUUID].active
		},
		audios: state => {
			return state.content.audios
		},
		isPlaying: state => {
			return state.content.audio.isPlaying
		},
		nextAudioID: (state, getters) => {
			let index = state.content.currentItem.id
			const resources = getters.resources

			while (index < resources.length - 1) {
				index++
				if (resources[index].type === "audio") {
					return index
				}
			}
			return false
		},
		prevAudioID: (state, getters) => {
			let i = state.content.currentItem.id
			const resources = getters.resources

			while (i > 0) {
				i--
				if (resources[i].type === "audio") {
					return i
				}
			}
			return false
		},
	},
})


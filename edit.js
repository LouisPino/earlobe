import {getEventById} from "./dbScript.js"
const queryString = window.location.search
const params = new URLSearchParams(queryString)
const id = params.get("id")

const event = await getEventById(id)

console.log(event)
package ocelot

import grails.rest.RestfulController
import grails.transaction.Transactional
import static org.springframework.http.HttpStatus.*

@Transactional(readOnly = false)
class PaletteItemController extends RestfulController {

	static responseFormats = ['json']

	PaletteItemController() {
		super(PaletteItem)
	}

	@Override
	def save() {

		def jsonReq = request.JSON

		def item = new PaletteItem()

		item.name = jsonReq.name
		item.description = jsonReq.description
		item.activated = jsonReq.activated
		item.props = jsonReq.props

		//TODO dar al usuario la opcion de subir su svg y subir o seleccionar de una lista el icono
		item.icon = "hola"
		item.svg = "hola"

		item.level = jsonReq.level
		item.bpmnElem = "bpmn:UndefinedTask"

		def category = CategoryItem.get(jsonReq.category.id)
		category.addToPaletteItems(item)

		item.save(flush: true)

		def palette = Palette.get(params.id)

		palette.addToPaletteItems(item).save flush: true, failOnError: true


		render status: OK
	}


	@Override
	def update() {
		def jsonReq = request.JSON

		if (params.id != jsonReq.id) {
			render status: CONFLICT
		}

		def instance = PaletteItem.get(params.id)

		if (instance == null) {
			render status: NOT_FOUND
		}

		instance.name = jsonReq.name
		instance.description = jsonReq.description
		instance.props = jsonReq.props.toString()
		instance.activated = jsonReq.activated
		instance.icon = jsonReq.icon
		instance.level = jsonReq.level
		instance.bpmnElem = jsonReq.bpmnElem

		//COSA MEVA
//        println("Hola carapolla " + JSON.parse(jsonReq.props.toString()))

		if (instance.category.id != jsonReq.category.id) {
			def category = CategoryItem.get(instance.category.id)
			category.removeFromPaletteItems(instance)

			category = CategoryItem.get(jsonReq.category.id)
			category.addToPaletteItems(instance)
		}

		instance.save flush: true

		//TODO preguntar a Ruben què fer en cas d'error

//        println instance.dump()

		render status: OK
	}

//    @Override
//    def update(){
//        def jsonReq = request.JSON
//
//        if(params.id != jsonReq.id){
//            render status: CONFLICT
//        }
//
//        def instance = PaletteItem.get(params.id)
//
//        if(instance == null){
//            render status: NOT_FOUND
//        }
//
//        instance.name = jsonReq.name
//        instance.description = jsonReq.description
//        instance.props = jsonReq.props
//        instance.activated = jsonReq.activated
//        instance.icon = jsonReq.icon
//
//        if(instance.category.id != jsonReq.category.id){
//            def category = CategoryItem.get(instance.category.id)
//            category.removeFromPaletteItems(instance)
//
//            category = CategoryItem.get(jsonReq.category.id)
//            category.addToPaletteItems(instance)
//        }
//
//        instance.save flush : true
//
//        //TODO preguntar a Ruben què fer en cas d'error
//
//        println instance.dump()
//
//        render status: OK
//
//    }
}

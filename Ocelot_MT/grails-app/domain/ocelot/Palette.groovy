package ocelot

class Palette {

	String name

	static hasMany = [paletteItems: PaletteItem, customPaletteItems: CustomPaletteItem]
//	static belongsTo = [user: Member]

	static constraints = {
	}
}
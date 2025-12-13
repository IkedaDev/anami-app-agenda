// withAndroidAccent.js
const { withAndroidStyles } = require("@expo/config-plugins");

module.exports = function withAndroidAccent(config) {
  return withAndroidStyles(config, async (config) => {
    const styles = config.modResults.resources.style;
    const terracota = "#C47F6B"; // Tu color exacto

    // 1. Buscar el tema principal de la App ('AppTheme')
    const appTheme = styles.find((style) => style.$.name === "AppTheme");

    if (appTheme) {
      // Le decimos a la App que cuando abra un DatePicker, use NUESTRO estilo
      assignStyleItem(
        appTheme,
        "android:datePickerDialogTheme",
        "@style/MyDatePickerStyle"
      );

      // Forzamos el color de acento global también
      assignStyleItem(appTheme, "colorAccent", terracota);
      assignStyleItem(appTheme, "android:colorAccent", terracota);
    }

    // 2. Crear nuestro estilo específico para el Calendario
    // Buscamos si ya existe para no duplicarlo
    let datePickerStyle = styles.find(
      (style) => style.$.name === "MyDatePickerStyle"
    );

    if (!datePickerStyle) {
      datePickerStyle = {
        $: {
          name: "MyDatePickerStyle",
          // Usamos un tema base "Light" para que los colores resalten bien
          parent: "Theme.AppCompat.Light.Dialog",
        },
        item: [],
      };
      styles.push(datePickerStyle);
    }

    // 3. Inyectar los colores en el estilo del calendario
    assignStyleItem(datePickerStyle, "colorAccent", terracota);
    assignStyleItem(datePickerStyle, "android:colorAccent", terracota);

    // Header (fondo de la parte superior donde sale el año)
    assignStyleItem(datePickerStyle, "android:headerBackground", terracota);

    // Colores de texto y botones
    assignStyleItem(datePickerStyle, "android:textColor", terracota);

    return config;
  });
};

// Función auxiliar para editar el XML sin dolor
function assignStyleItem(styleObj, name, value) {
  if (!styleObj.item) styleObj.item = [];

  const item = styleObj.item.find((i) => i.$.name === name);
  if (item) {
    item._ = value; // Actualizar si existe
  } else {
    styleObj.item.push({ $: { name }, _: value }); // Crear si no existe
  }
}

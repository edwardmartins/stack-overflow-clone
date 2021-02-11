$(() => {

    let tags = []
    $("#tags").on("click", '#tag', (event) => {
        let tagPulsado = $(event.target).text().trim();
        let cadenaTags = ''

        if (!tags.includes('@' + tagPulsado)) { // si no esta incluido lo incluye
            tags.push('@' + tagPulsado)
        }

        tags.forEach(tag =>{
            cadenaTags += tag
        })

        $("#tagw").val(cadenaTags);
    });
})
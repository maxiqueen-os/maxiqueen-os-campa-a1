const myWidget = cloudinary.createUploadWidget({

    cloudName: 'TU_CLOUD_NAME',

    uploadPreset: 'TU_UPLOAD_PRESET',

    singleUploadAutoClose: false

}, (error, result) => {

    if (!error && result &&
        result.event === "success") {

        console.log(result.info);

    }

});

document
.getElementById("upload_widget")
?.addEventListener("click", () => {

    myWidget.open();

});

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
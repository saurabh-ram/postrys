
const blueImageExt = "-blue";

// Check if an individual element exists
function addEventIfIdExists(selector, event, callback) {
    const element = document.querySelector(selector);
    if (element) element.addEventListener(event, callback);
}

async function getBlueImageName(imageSrc) {
    if (!imageSrc.includes(blueImageExt)) {
        const len = imageSrc.split(".").length;
        const ext = imageSrc.split(".")[len - 1];
        return imageSrc.slice(0, (- 1 - ext.length)) + blueImageExt + "." + ext;
    }
    return imageSrc;
}

async function getOgImageName(imageSrc) {
    if (imageSrc.includes(blueImageExt)) {
        const len = imageSrc.split(".").length;
        const ext = imageSrc.split(".")[len - 1];
        return imageSrc.slice(0, (- 1 - ext.length - blueImageExt.length)) + "." + ext;
    }
    return imageSrc;
}

async function showImage(inputId, previewId) {
    console.log(previewId);
    const previewImg = document.getElementById(previewId);
    let imageLink = URL.createObjectURL(document.getElementById(inputId).files[0]);
    previewImg.style.backgroundImage = `url(${imageLink})`;
    previewImg.firstElementChild.style.display = "none";
    previewImg.textContent = "";
    previewImg.style.border = 0;
}

async function setupDropZone(dropZoneId, inputId, previewId) {
    const dropZone = document.getElementById(dropZoneId);
    const imgView = document.getElementById(dropZoneId).querySelector(".imgView");
    const fileInput = document.getElementById(inputId);

    // imgView.addEventListener("click", () => fileInput.click());

    dropZone.addEventListener("dragover", async (e) => {
        e.preventDefault();
        imgView.classList.add("highlight");
        Array.from(imgView.getElementsByTagName("span")).forEach(s => {
            s.classList.remove("grey-text");
            s.style.color = "#008cff";
        });
        let imageSrc = imgView.firstElementChild.src;
        imgView.firstElementChild.src = await getBlueImageName(imageSrc);
    });

    dropZone.addEventListener("dragleave", async () => {
        imgView.classList.remove("highlight");
        Array.from(imgView.getElementsByTagName("span")).forEach(s => {
            s.style.removeProperty("color");
            s.classList.add("grey-text");
        });
        let imageSrc = imgView.firstElementChild.src;
        imgView.firstElementChild.src = await getOgImageName(imageSrc);
    });

    dropZone.addEventListener("drop", async (e) => {
        e.preventDefault();
        imgView.classList.remove("highlight");
        imgView.firstElementChild.style.display = "none";
        const file = e.dataTransfer.files[0];
        if (file) {
            fileInput.files = e.dataTransfer.files;
            await showImage(inputId, previewId);
            dropZone.querySelector(".fileName").textContent = file.name;
        }
    });

    fileInput.addEventListener("change", async () => {
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            await showImage(inputId, previewId);
            dropZone.querySelector(".fileName").textContent = file.name;
        }
    });
}

async function main() {

    // Add an Event Listener for Hamburger
    addEventIfIdExists(".hamburger", "click", () => {
        document.querySelector(".right-side-bar").style.transform = "translateX(0%)";
        document.querySelector(".right-side-bar").style.right = "0";
        document.querySelector(".right-side-bar").style.opacity = "1";
    });

    // Add an Event Listener for Close button
    addEventIfIdExists("#closeHamBtn", "click", () => {
        document.querySelector(".right-side-bar").style.transform = "var(--sidebarTransform)";
        document.querySelector(".right-side-bar").style.opacity = "0.5";
    });
    
    // Initialize drag & drop for both image zones
    await setupDropZone("uploadPoster", "posterUploadBtn", "posterPreview");
    await setupDropZone("uploadImage", "imageUploadBtn", "imagePreview");

    document.getElementById("createPosterBtn").addEventListener("click", async () => {
        const posterFile = document.getElementById("posterUploadBtn").files[0];
        const personFile = document.getElementById("imageUploadBtn").files[0];

        if (!posterFile || !personFile) {
            alert("Please upload both images!");
            return;
        }

        const formData = new FormData();
        formData.append("posterImage", posterFile);
        formData.append("personImage", personFile);

        const createPosterBtn = document.getElementById("createPosterBtn");
        createPosterBtn.textContent = "Processing...";
        createPosterBtn.disabled = true;

        try {
            const response = await fetch("/create-poster", {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                let errorMessage = "Error processing images";
                try {
                    const errorText = await response.text(); // Read response as text
                    errorMessage = JSON.parse(errorText).error || errorText;
                } catch (parseError) {
                    console.error("Failed to parse error response:", parseError);
                }
                throw new Error(errorMessage);
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            // Store the generated URL in a global variable
            window.generatedPosterUrl = url;

            // Show download button
            const downloadBtn = document.getElementById("downloadBtn");
            downloadBtn.href = url;
            downloadBtn.style.display = "block";

            createPosterBtn.textContent = "Create Poster";
            createPosterBtn.disabled = false;
        } catch (error) {
            alert("Failed to create poster: " + error.message);
            console.error(error);
            createPosterBtn.textContent = "Create Poster";
            createPosterBtn.disabled = false;
        }
    });

    document.getElementById("downloadBtn").addEventListener("click", () => {
        if (!window.generatedPosterUrl) {
            alert("No poster available for download!");
            return;
        }
        const link = document.createElement("a");
        link.href = window.generatedPosterUrl;
        link.download = "poster.png"; // Ensures proper file name
        link.click();
    });
    
}

main();


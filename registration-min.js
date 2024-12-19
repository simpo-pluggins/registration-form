var bId;
var registrationFieldData;
var env;
var bName;
var templates;

class registrationMini {
    constructor() {
        window.onload = function () {
            const urlParams = new URLSearchParams(window.location.search);
            let fontFamily = urlParams.get('ff');
            bId = urlParams.get('bId');
            env = urlParams.get('denv');
            bName = urlParams.get('name');
            if (fontFamily) {
                // document.body.style.fontFamily = decodeURIComponent(fontFamily);
                // const decodedFontFamily = decodeURIComponent(fontFamily);
                // document.body.style.fontFamily = decodedFontFamily;
            }
            if (bId) {
                fetchAllRegistrationFields();
                getSuccessTemplateValues();
            }
        }
    }
}

function getSuccessTemplateValues(){
    let fetchUrl;
    if(env === 'PRE-PROD'){
        fetchUrl = `https://dev-api.simpo.ai/crm/templates?status=true&formCategory=REGISTRATION&pageNo=0&size=20`
    }
    else if(env === 'PROD'){
        fetchUrl = `https://api.simpo.ai/crm/templates?status=true&formCategory=REGISTRATION&pageNo=0&size=20`
    }
    fetch(fetchUrl)
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(response => {
        templates = response.data.data[0].templates;

        console.log(templates);
    })
    .catch(error => {
        console.error('Error fetching data:', error);
    });
}

async function fetchAllRegistrationFields() {
    let fetchUrl;
    if (env === 'PRE-PROD') {
        fetchUrl = `https://dev-api.simpo.ai/crm/fields?businessId=${bId}&status=true&showInErp=REGISTRATION&isPagination=false&fieldCategory=REGISTRATION`
    }
    else if (env === 'PROD') {
        fetchUrl = `https://api.simpo.ai/crm/fields?businessId=${bId}&status=true&showInErp=REGISTRATION&isPagination=false&fieldCategory=REGISTRATION`
    }
    fetch(fetchUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(res => {
            registrationFieldData = getFieldsForAdmission(res.data.data)
            loadAllRegistrationFields();
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}

function getFieldsForAdmission(fieldsList) {
    let map = {};

    for (let field of fieldsList) {
        for (let fieldGroup of field.fieldGroup) {
            if (!fieldGroup.fieldStepId)
                continue;

            let stepName = fieldGroup.fieldStepName ? fieldGroup.fieldStepName : 'undefined';
            let groupName = fieldGroup.fieldGroupName;

            if (!map[stepName]) {
                map[stepName] = {};
            }
            if (!map[stepName][groupName]) {
                map[stepName][groupName] = [];
            }
            field['fieldStepId'] = fieldGroup.fieldStepId;
            field['fieldGroupId'] = fieldGroup.fieldGroupId;

            const newField = JSON.parse(JSON.stringify(field));
            map[stepName][groupName].push(newField);
        }
    }

    return map;
}

function loadAllRegistrationFields() {
    console.log(registrationFieldData);

    const registrationForm = document.getElementById("complete-registration-form");

    if (!registrationForm) return;

    const tabContainer = document.createElement("ul");
    tabContainer.className = "nav nav-tabs";
    tabContainer.id = "registrationTabs";
    registrationForm.appendChild(tabContainer);

    const tabContentContainer = document.createElement("div");
    tabContentContainer.className = "tab-content";
    registrationForm.appendChild(tabContentContainer);

    let isFirstTab = true;
    const tabIds = [];

    Object.keys(registrationFieldData).forEach((tabName, tabIndex) => {
        const tabId = `tab-${tabIndex}`;
        tabIds.push(tabId);

        const tabItem = document.createElement("li");
        tabItem.className = "nav-item";
        tabContainer.appendChild(tabItem);

        const tabLink = document.createElement("a");
        tabLink.className = `nav-link ${isFirstTab ? "active" : ""}`;
        tabLink.setAttribute("data-bs-toggle", "tab");
        tabLink.id = `${tabId}-tab`;
        tabLink.href = `#${tabId}`;
        tabLink.role = "tab";
        tabLink.innerText = tabName;
        tabItem.appendChild(tabLink);

        const tabContent = document.createElement("div");
        tabContent.className = `tab-pane fade ${isFirstTab ? "show active" : ""}`;
        tabContent.id = tabId;
        tabContentContainer.appendChild(tabContent);

        const tabData = registrationFieldData[tabName];
        Object.keys(tabData).forEach((group) => {
            // Create fields-container
            const fieldsContainer = document.createElement("div");
            fieldsContainer.className = "fields-container";

            // Add group header inside fields-container
            const groupHeader = document.createElement("h5");
            groupHeader.className = "group-header";
            groupHeader.innerText = group.replace(/([A-Z])/g, " $1");
            fieldsContainer.appendChild(groupHeader);

            // Create group-of-fields container
            const groupOfFields = document.createElement("div");
            groupOfFields.className = "group-of-fields";

            const fields = tabData[group];
            fields.forEach((field) => {
                const formGroup = document.createElement("div");
                formGroup.className = "form-group";

                const label = document.createElement("label");
                label.innerHTML = field.required ? `${field.fieldLabel} <span style="color: red;">*</span>` : field.fieldLabel;

                label.className = "label-with-margin";
                formGroup.appendChild(label);

                let input;

                if (field.dataType === "DROPDOWN") {
                    input = document.createElement("select");
                    input.className = "form-control";

                    let options = [];

                    if (Array.isArray(field.value) && field.value.length > 0) {
                        options = field.value;
                    } else if (field.value === null && field.sourceData) {
                        const dynamicKey = field.fieldLabel.toUpperCase().replace(/\s/g, "_");
                        const listFields = field.sourceData[dynamicKey] || [];
                        listFields.forEach((element) => {
                            options.push({
                                label: element.name,
                                value: element.name.split(" ").join("_").toUpperCase(),
                            });
                        });
                    }

                    const defaultOption = document.createElement("option");
                    defaultOption.value = "";
                    defaultOption.innerText = "--Select--";
                    input.appendChild(defaultOption);

                    options.forEach((opt) => {
                        const optionElement = document.createElement("option");
                        optionElement.value = opt.value;
                        optionElement.innerText = opt.label;
                        input.appendChild(optionElement);
                    });

                    input.addEventListener("change", (e) => {
                        field.sendingValue = e.target.value;
                    });
                    
                } else if (field.dataType === "TEXT") {
                    input = document.createElement("input");
                    input.type = "text";
                    input.className = "form-control";
                    input.addEventListener('input', (e) => {
                        field.sendingValue = e.target.value;
                    });
                } else if (field.dataType === "NUMBER") {
                    input = document.createElement("input");
                    input.type = "number";
                    input.className = "form-control";
                    input.addEventListener('input', (e) => {
                        field.sendingValue = e.target.value;
                    });
                }
                else if (field.dataType === "DATE") {
                    input = document.createElement("input");
                    input.type = "date";
                    input.className = "form-control";
                    input.addEventListener('input', (e) => {
                        field.sendingValue = e.target.value;
                    });
                }

                else {
                    input = document.createElement("input");
                    input.type = "text";
                    input.className = "form-control";
                    input.addEventListener('input', (e) => {
                        field.sendingValue = e.target.value;
                    });
                }

                input.placeholder = field.hint || "";
                formGroup.appendChild(input);
                groupOfFields.appendChild(formGroup); 
            });

            fieldsContainer.appendChild(groupOfFields);
            tabContent.appendChild(fieldsContainer);
        });

        // Add Next/Submit Button
        const buttonContainer = document.createElement("div");
        buttonContainer.className = "button-container mt-3";

        const button = document.createElement("button");
        button.className = "btn btn-primary next-submit-btn button_value";

        if (tabIndex < Object.keys(registrationFieldData).length - 1) {
            button.innerText = "Next";
            button.onclick = () => {
                const nextTabId = tabIds[tabIndex + 1];
                const nextTabLink = document.querySelector(`#${nextTabId}-tab`);
                nextTabLink.click();
            };
        } else {
            button.innerText = "Submit";
            button.onclick = submit;
        }

        buttonContainer.appendChild(button);
        tabContent.appendChild(buttonContainer);

        isFirstTab = false;
    });
}

async function submit() {
    const convertingValues = convertToListOfFields();

    const payload = {
        "businessDetails": {
          "id": bId,
          "name": bName
        },
        "staffDetails": {
          "id":null,
          "name":null
        },
        "fieldItems": convertingValues,
        "edit" : false
      }
    if(env === 'PRE-PROD'){
        submitFormEndPoint = `https://dev-api.simpo.ai/crm/registration/?enquiryId=${payload?.enquiryId || ''}`
    }
    else if(env === 'PROD'){
        submitFormEndPoint = `https://api.simpo.ai/crm/registration/?enquiryId=${payload?.enquiryId || ''}`
    }

    // try{
    //     const response = await fetch(submitFormEndPoint, {
    //         method: 'POST',
    //         headers: {
    //             'Content-Type': 'application/json',
    //         },
    //         body: JSON.stringify(payload),
    //     });
    //     if (!response.ok) {
    //         throw new Error('Network response was not ok');
    //     }

    //     const data = await response.json();
        openPopup('SUCCESS')
    // }
    // catch (error){
        // openPopup('FAILED')
    // }
}

function openPopup(ev) {
    let originalData = templates[ev];

    const templateImage = document.getElementById('success_fail_image');
    const templateTitle = document.getElementById('success_fail_title');
    const templateMessage = document.getElementById('success_fail_message');
    const templateButton = document.getElementById('succes_fail_button');

    if(templateImage){
        templateImage.src = originalData.attachmentUrl;
        templateImage.alt = ev+' image'
    }
    if(templateTitle){
        templateTitle.innerHTML = originalData?.name;
    }
    if(templateMessage){
        templateMessage.innerHTML = originalData?.message;
    }
    if(templateButton){
        templateButton.innerHTML = originalData?.buttons[0].label;
    }

    var myModal = new bootstrap.Modal(document.getElementById('successModal'));
    myModal.show();

    document.getElementById('successModal').addEventListener('hidden.bs.modal', function () {
        clearFormData();
    });
}

function clearFormData(){
    const registrationForm = document.getElementById("complete-registration-form");
    if (!registrationForm) return;
    const inputs = registrationForm.querySelectorAll('input, select');
    inputs.forEach((input) => {
        if (input.type === 'text' || input.type === 'number' || input.type === 'date') {
            input.value = '';
        } else if (input.tagName.toLowerCase() === 'select') {
            input.selectedIndex = 0;
        }
    });
}

function convertToListOfFields() {
    let fieldList = [];

    for(let step of Object.keys(registrationFieldData)) {
      for(let group of Object.keys(registrationFieldData[step])) {
        for(let field of registrationFieldData[step][group]) {

          fieldList.push({
            fieldId: field.fieldId,
            fieldName: field.fieldLabel,
            fieldValue: field.sendingValue,
            fieldGroupId: field.fieldGroupId,
            fieldGroupName: group,
            fieldStepId: field.fieldStepId,
            fieldStepName: step
          })

        }
      }
    }

    return fieldList;
  }


registration = new registrationMini();
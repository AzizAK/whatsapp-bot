const { Builder, By, Key, until, Capabilities } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const chromedriver = require("chromedriver");
const excelScehma = "./excelSchema.js";
const { isNumber, isNotEmpty, delay } = require("../helpers");
const delayTime = 10000;
chrome.setDefaultService(new chrome.ServiceBuilder(chromedriver.path).build());
let driver = new Builder()
  .withCapabilities(Capabilities.chrome())
  .setChromeOptions(
    new chrome.Options()
      .setUserPreferences({
        "profile.managed_default_content_settings.popups": 2,
      })
      //.setChromeBinaryPath("/Applications/Brave Browser.app/Contents/MacOS/Brave Browser")
      .addArguments("--disable-notifications")
      .addArguments("--enable-logging")
  )
  .build();

openWhatsapp();
const xlsxFile = require("read-excel-file/node");
let excelPath = "";
async function sendMessage() {
  changeText("status", "جاري الإرسال");

  try {
    let counter = 0;
    const excel = await xlsxFile(excelPath, excelScehma);
    excel.forEachAsync(async (row) => {
      counter++;
      const mobileNumberText = row[1];
      const messageText = row[2];

      if (
        !isNumber(mobileNumberText) ||
        !isNotEmpty(messageText) ||
        messageText == "null" ||
        !messageText
      ) {
        addError(`رقم الجوال أو الرسالة خطأ في ملف الإكسل للصف (${counter})`);
        return;
      }

      const mobileNumber = `966${mobileNumberText}`;
      const message = encodeURIComponent(messageText);
      try {
        changeText(
          "workingOn",
          `جاري العمل على: ${mobileNumberText}, برسالة: ${messageText}`
        );
        await driver.get(
          `https://web.whatsapp.com/send?phone=${mobileNumber}&text=${message}&app_absent=0`
        );

        await delay(delayTime);
        await (
          await driver.findElement(
            By.css("#main > footer > div:nth-child(1) > div:nth-child(3)")
          )
        ).click();

        addSuccess(
          `تم ارسال الرسالة بنجاح لـ(${mobileNumberText}) بالصف (${counter})`
        );
        await delay(delayTime);

        //await (await driver).switchTo().alert()).accept();
      } catch (e) {
        addError(`يوجد خطأ بالصف (${counter}) ${e}`);
        console.log(e);
      }
    });
  } catch (e) {
    addError(`خطأ عام ${e}`);
    console.log(e);
  } finally {
    changeText("status", "انتهى");
  }
}

// const button2 = document.getElementById("start");
// button2.addEventListener("click", () => {
//   openWhatsapp();
// });

const fileSelector = document.getElementById("file-selector");
fileSelector.addEventListener("change", (event) => {
  const fileList = event.target.files;
  excelPath = fileList[0].path;
});

const button = document.getElementById("message");
button.addEventListener("click", () => {
  sendMessage();
});

async function openWhatsapp() {
  try {
    await driver.get("https://web.whatsapp.com/");
    console.log("=== Whatsapp Opened ===");
  } catch (e) {
    console.log(e);
  } finally {
    console.log("Finally");
  }
}

function addError(error) {
  var tbodyRef = document
    .getElementById("errorsTable")
    .getElementsByTagName("tbody")[0];
  var newRow = tbodyRef.insertRow();
  var newCell = newRow.insertCell();
  var newText = document.createTextNode(error);
  newCell.appendChild(newText);
}

function addSuccess(success) {
  var tbodyRef = document
    .getElementById("successTable")
    .getElementsByTagName("tbody")[0];
  var newRow = tbodyRef.insertRow();
  var newCell = newRow.insertCell();
  var newText = document.createTextNode(success);
  newCell.appendChild(newText);
}

function changeText(id, status) {
  span = document.getElementById(id);
  span.textContent = status;
}

Array.prototype.forEachAsync = async function (fn) {
  for (let t of this) {
    await fn(t);
  }
};

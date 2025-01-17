import convert from "../services/convertRate.js";

function test1() {
  try {
    let result = convert.convertRateToAmount.convert(100, "USD", "EUR");
    console.log(result);

    try {
      convert.convertRateToAmount.convert(100, "USD", "LAK");
      console.log("This line should not be executed");
    } catch (error) {
      console.log("This line should be executed");
      console.log(error.message);
    }
  } catch (error) {
    console.log(error.message);
  }
}

test1();


const hour = {
    waveHeight: undefined
};

console.log("Testing undefined.waveHeight?.ecmwf");
try {
    if (!hour.waveHeight?.ecmwf) {
        console.log("Caught: !hour.waveHeight?.ecmwf is true for undefined");
    } else {
        console.log("NOT Caught: !hour.waveHeight?.ecmwf is false for undefined");
        const height = hour.waveHeight.ecmwf;
        console.log("Height:", height);
    }
} catch (e) {
    console.log("Error:", e.message);
}

const hour2 = {
    waveHeight: { ecmwf: 1.5 }
};
console.log("\nTesting valid object");
try {
    if (!hour2.waveHeight?.ecmwf) {
        console.log("Caught: !hour2.waveHeight?.ecmwf is true");
    } else {
        console.log("NOT Caught: !hour2.waveHeight?.ecmwf is false");
        const height = hour2.waveHeight.ecmwf;
        console.log("Height:", height);
    }
} catch (e) {
    console.log("Error:", e.message);
}

const hour3 = {
    waveHeight: null
};
console.log("\nTesting null.waveHeight?.ecmwf");
try {
    if (!hour3.waveHeight?.ecmwf) {
        console.log("Caught: !hour3.waveHeight?.ecmwf is true for null");
    } else {
        console.log("NOT Caught: !hour3.waveHeight?.ecmwf is false for null");
        const height = hour3.waveHeight.ecmwf;
        console.log("Height:", height);
    }
} catch (e) {
    console.log("Error:", e.message);
}

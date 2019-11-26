
function* test()
{
    for(var count=0; count<100; count++)
    {
        // Some Processing Here
    }

    yield count;

    // ---------------- //

    var data = [4,3,2,1,5];
    data.sort();

    yield data;
}

function run()
{
    var testGen = test();
    console.log("Some Procesing A");
    console.log(testGen.next().value);
    console.log("Some Procesing B");
    console.log(testGen.next().value);
    console.log("Some Procesing C");
    console.log(testGen.next().value);
}

run();
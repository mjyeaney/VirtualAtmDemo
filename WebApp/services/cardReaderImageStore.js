//
// Tracks the last card reader diagnostics check-in.
//

((scope) => {
    if (!scope.CardReaderImageStore){
        scope.CardReaderImageStore = {};
    }

    // In-memory is fine for demo
    let _tempStorage = null;

    // Adds a image details to the temp store
    const setImageInfo = (info) => {
        console.log("Saving card reader image info...");
        _tempStorage = info;
    };

    // Returns recorded image details
    const getImageInfo = () => {
        return _tempStorage;
    };

    scope.CardReaderImageStore.GetLatestImageInfo = getImageInfo;
    scope.CardReaderImageStore.UpdateLatestImageInfo = setImageInfo;
})(this);


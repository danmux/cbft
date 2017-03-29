function initBleveIndexMappingController(
    $scope, $http, $log, $uibModal, indexMappingIn, options) {
    options = options || {};

    $scope.static_prefix = $scope.static_prefix || 'static-bleve-mapping';

	var indexMapping =
        $scope.indexMapping = JSON.parse(JSON.stringify(indexMappingIn));

    indexMapping.defaultMappingKey = "defaultMappingKey_" +
        Math.random() + Math.random() + Math.random();

    indexMapping.types =
        indexMapping.types || {};
    indexMapping.analysis =
        indexMapping.analysis || {};
	indexMapping.analysis.analyzers =
        indexMapping.analysis.analyzers || {};
	indexMapping.analysis.char_filters =
        indexMapping.analysis.char_filters || {};
	indexMapping.analysis.tokenizers =
        indexMapping.analysis.tokenizers ||{};
	indexMapping.analysis.token_filters =
        indexMapping.analysis.token_filters || {};
	indexMapping.analysis.token_maps =
        indexMapping.analysis.token_maps || {};

    if (indexMapping["default_mapping"]) {
        indexMapping.types[indexMapping.defaultMappingKey] = indexMapping["default_mapping"];
    }

    var tmc = initBleveTypeMappingController($scope, indexMapping.types,
                                             indexMapping.defaultMappingKey, options);

    $scope.isValid = function() { return tmc.isValid(); };

    $scope.indexMappingResult = indexMappingResult;

    BleveAnalysisCtrl($scope, $http, $log, $uibModal);

    // ------------------------------------------------

    $scope.analyzerNames = options.analyzerNames || [];
	$scope.loadAnalyzerNames = function() {
        $http.post('/api/_analyzerNames', $scope.indexMappingResult()).
        success(function(data) {
            $scope.analyzerNames = data.analyzers;
        }).
        error(function(data, code) {
			$scope.errorMessage = data;
        });
	};
    if (options.analyzerNames == null) {
	    $scope.loadAnalyzerNames();
    }

    $scope.dateTimeParserNames = options.dateTimeParserNames || [];
	$scope.loadDatetimeParserNames = function() {
        $http.post('/api/_datetimeParserNames', $scope.indexMappingResult()).
        success(function(data) {
            $scope.dateTimeParserNames = data.datetime_parsers;
        }).
        error(function(data, code) {
			$scope.errorMessage = data;
        });
	};
    if (options.dateTimeParserNames == null) {
	    $scope.loadDatetimeParserNames();
    }

    // ------------------------------------------------

    return {
        // Allows the caller to determine if there's a valid index mapping.
        isValid: $scope.isValid,

        // Allows the caller to retrieve the current index mapping,
        // perhaps in response to a user's Create/Done/OK button click;
        // or, the user wanting to see the index mapping JSON.
        indexMapping: $scope.indexMappingResult
    }

    // ------------------------------------------------

    function indexMappingResult() {
        if (!$scope.isValid()) {
            return null;
        }

        return bleveIndexMappingScrub($scope.indexMapping, tmc)
    }
}

function bleveIndexMappingScrub(indexMapping, tmc) {
    var r = JSON.parse(JSON.stringify(indexMapping));

    if (tmc) {
        r.types = tmc.typeMapping();
        r.default_mapping = r.types[indexMapping.defaultMappingKey];
        delete r.types[indexMapping.defaultMappingKey];
    }

    delete r["defaultMappingKey"]

    return JSON.parse(JSON.stringify(scrub(r, "")));

    // Recursively remove every entry with '$' prefix, which might be
    // due to angularjs metadata.
    function scrub(m, path) {
        if (typeof(m) == "object") {
            for (var k in m) {
                if (typeof(k) == "string" && k.charAt(0) == "$") {
                    delete m[k];
                    continue;
                }

                if (k == "display_order" && typeof(m[k]) == "string") {
                    var i = parseInt(m[k]);
                    if (i >= 0 && String(i) == m[k]) {
                        delete m[k];
                        continue;
                    }
                }

                m[k] = scrub(m[k], path + "/" + k);

                if (typeof(m[k]) == "object" && isEmpty(m[k])) {
                    // Don't remove empty tokens [] array under the path of
                    // "/analysis/token_maps/$TOKEN_MAP_NAME/tokens".
                    if (path.match(/^\/analysis\/token_maps\/[^\/]*$/) &&
                        k == "tokens") {
                        continue;
                    }
                    delete m[k];
                }
            }
        }

        return m;
    }

    function isEmpty(obj) {
        for (var k in obj) {
            return false;
        }
        return true;
    }
}

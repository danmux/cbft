//  Copyright (c) 2017 Couchbase, Inc.
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the
//  License. You may obtain a copy of the License at
//    http://www.apache.org/licenses/LICENSE-2.0
//  Unless required by applicable law or agreed to in writing,
//  software distributed under the License is distributed on an "AS
//  IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
//  express or implied. See the License for the specific language
//  governing permissions and limitations under the License.

function BleveAnalyzerModalCtrl($scope, $modalInstance, $http,
                                name, value, mapping, static_prefix) {
    $scope.origName = name;
    $scope.name = name;
    $scope.errorMessage = "";
    $scope.formpath = "";
    $scope.mapping = mapping;
    $scope.static_prefix = static_prefix;

    $scope.analyzer = {};
    // copy in value for editing
    for (var k in value) {
        // need deeper copy of nested arrays
        if (k == "char_filters") {
            newcharfilters = [];
            for (var cfi in value.char_filters) {
                newcharfilters.push(value.char_filters[cfi]);
            }
            $scope.analyzer.char_filters = newcharfilters;
        } else if (k == "token_filters") {
            newtokenfilters = [];
            for (var tfi in value.token_filters) {
                newtokenfilters.push(value.token_filters[tfi]);
            }
            $scope.analyzer.token_filters = newtokenfilters;
        } else {
            $scope.analyzer[k] = value[k];
        }
    }

    $scope.tokenizerNames = [];

    $scope.loadTokenizerNames = function() {
        $http.post('/api/_tokenizerNames', bleveIndexMappingScrub(mapping)).
        then(function(response) {
            var data = response.data;
            $scope.tokenizerNames = data.tokenizers;
        }, function(response) {
            var data = response.data;
            $scope.errorMessage = data;
        });
    };

    $scope.loadTokenizerNames();

    $scope.charFilterNames = [];

    $scope.loadCharFilterNames = function() {
        $http.post('/api/_charFilterNames', bleveIndexMappingScrub(mapping)).
        then(function(response) {
            var data = response.data;
            $scope.charFilterNames = data.char_filters;
        }, function(response) {
            var data = response.data;
            $scope.errorMessage = data;
        });
    };

    $scope.loadCharFilterNames();

    $scope.addCharFilter = function(scope) {
        filter = scope.addCharacterFilterName;
        if (filter !== undefined && filter !== "") {
            $scope.selectedAnalyzer.char_filters.push(filter);
        }
    };

    $scope.removeCharFilter = function(index) {
        $scope.selectedAnalyzer.char_filters.splice(index, 1);
    };

    $scope.tokenFilterNames = [];

    $scope.loadTokenFilterNames = function() {
        $http.post('/api/_tokenFilterNames', bleveIndexMappingScrub(mapping)).
        then(function(response) {
            var data = response.data;
            $scope.tokenFilterNames = data.token_filters;
        }, function(response) {
            var data = response.data;
            $scope.errorMessage = data;
        });
    };

    $scope.loadTokenFilterNames();

    $scope.addCharFilter = function(scope) {
        filter = scope.addCharacterFilterName;
        if (filter !== undefined && filter !== "") {
            $scope.analyzer.char_filters.push(filter);
        }
    };

    $scope.removeCharFilter = function(index) {
        $scope.analyzer.char_filters.splice(index, 1);
    };

    $scope.addTokenFilter = function(scope) {
        filter = scope.addTokenFilterName;
        if (filter !== undefined && filter !== "") {
            $scope.analyzer.token_filters.push(filter);
        }
    };

    $scope.removeTokenFilter = function(index) {
        $scope.analyzer.token_filters.splice(index, 1);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

    $scope.build = function(name) {
        if (!name) {
            $scope.errorMessage = "Name is required";
            return;
        }

        // name must not already be used
        if (name != $scope.origName &&
            $scope.mapping.analysis.analyzers[name]) {
            $scope.errorMessage = "Analyzer named '" + name + "' already exists";
            return;
        }

        // ensure that this new mapping component is valid
        analysis = {};
        for (var ak in $scope.mapping.analysis) {
            analysis[ak] = $scope.mapping.analysis[ak];
        }
        analyzers = {};
        analyzers[name] = $scope.analyzer;
        analysis["analyzers"] = analyzers;

        testMapping = {
            "analysis": analysis
        };

        $http.post('/api/_validateMapping', bleveIndexMappingScrub(testMapping)).
        then(function(response) {
            // if its valid return it
            result = {};
            result[name] = $scope.analyzer;
            $modalInstance.close(result);
        }, function(response) {
            // otherwise display error
            var data = response.data;
            $scope.errorMessage = data;
        });
    };
};

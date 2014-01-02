'use strict';

/* Controllers */

angular.module('myApp.controllers', []).
controller('MyCtrl1', [function() {
	$('#navbar').children('.active').removeClass('active');
	$('#view1').addClass('active');
}])
.controller('MyCtrl2', [function() {
	$('#navbar').children('.active').removeClass('active');
	$('#view2').addClass('active');
}])
.controller('TodoController', function($scope, $http) {
	$('#navbar').children('.active').removeClass('active');
	$('#todos').addClass('active');

  	// Array representing the list of todos
  	$scope.todos = [];
    // Load status
    $scope.loaded = false;
    
    $http.get('/todos').success(function(data, status, headers, config) {
    	$scope.loaded = true;
    	$scope.todos = data;
    });

    $scope.addTodo = function(title) {
    	if (title) {
            // Each todo is an object with a title, completed status and a generated ID
            var new_todo = {
            	title: title,
            	completed: false,
            	id: generateID()
            };
            // $http is used to execute http requests (POST, GET, PUT and DELETE)
            // Posts the "new_todo" object to the "/todo" endpoint
            $http.post('/todos', new_todo).success(function(data, status, headers, config) {
                // Reset the title to an empty string
                $scope.newTodoTitle = '';
                // Push the newly created todo into the list
                $scope.todos.push(new_todo);
                // Triggering Google Analytics event with category:create, action:click and label:todo
                _gaq.push(['_trackEvent', 'create', 'click', 'todo']);
            });
        }
    };

    $scope.changeCompleted = function(todo) {
        // Update the todo
        $http.put('/todos/' + todo.id).success(function(data, status, headers, config) {
        	if (data.result === 'Updated') {
        		console.log('Todo updated! ID: ' + todo.id);
                // Triggering Google Analytics event with category:update, action:check and label:todo
                _gaq.push(['_trackEvent', 'update', 'ckeck', 'todo']);
            } else {
            	console.log('Something went wrong: ' + data.error);
            }
        });
        var message = (todo.completed === true) ? 'Task Completed!' : 'Task Uncompleted!';
    };

    $scope.removeCompletedItems = function() {
        // Array to contain all uncompleted todos
        var uncompleted_todos = [];
        $scope.todos.forEach(function(todo) {
            // If a todo is completed, delete it
            if (todo.completed === true) {
            	console.log(todo.id);
            	deleteTodo(todo.id);
            }
            else {
            	uncompleted_todos.push(todo);
            }
        });
        // Set todo list to list of uncompleted todos
        $scope.todos = uncompleted_todos;
        // Triggering Google Analytics event with category:remove, action:click and label:todo
        _gaq.push(['_trackEvent', 'remove', 'click', 'todo']);
    };

    function deleteTodo(id) {
        // Delete a todo by its ID
        $http.delete('/todos/' + id).success(function(data, status, headers, config) {
        	if (data.result === 'success') {
        		console.log('Todo deleted! ID: ' + id);
        	} else {
        		console.log('Something went wrong: ' + data.error);
        	}
        });
    }

    // Random ID generator
    function generateID() {
    	var rand = Math.random();
    	$scope.todos.forEach(function(todo) {
    		if (todo.id === rand) {
    			generateID();
    		}
    	});
    	return rand;
    }
});
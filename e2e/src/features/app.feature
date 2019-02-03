Feature: Go to the home
  See the log-in screen

  Scenario: Home Page
    Given I am on the home page
    When I do nothing
    Then I should see log-in screen

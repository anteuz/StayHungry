Feature: Sign-in
  Enter username & password to sign-in

  Scenario: Valid User
    Given I am on the sign-in page
    When I enter valid username
    And I have correct password
    And I click log-in
    Then I should see shoppin-list page

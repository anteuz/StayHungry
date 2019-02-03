Feature: Sign-in
  Enter username & password to sign-in

  Scenario: Valid User
    Given I am on the sign-in page
    When I enter valid credentials
    Then I should see shoppin-list page

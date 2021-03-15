pragma solidity >=0.4.0 <0.6.0;

contract Election {
  // Model a candidate
  struct Candidate {
    uint id;
    string name;
    uint voteCount;
  }

  // Store accounts that was voted
  mapping(address => bool) public voters;

  // Store candidates
  mapping(uint => Candidate) public candidates;

  // Store the count of candidates
  uint public candidatesCount;

  // Voted event
  event votedEvent(uint indexed _candidateId);

  constructor() public {
    addCondidate('Candidate 1');
    addCondidate('Candidate 2');
  }

  function addCondidate(string memory _name) private {
    candidatesCount++;
    candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
  }

  function vote(uint _candidateId) public {
    // require that they haven't voted before
    require(!voters[msg.sender]);

    // require a valid candidate
    require(_candidateId > 0 && _candidateId <= candidatesCount);

    // record that voter has voted
    voters[msg.sender] = true;

    // update candidate vote count
    candidates[_candidateId].voteCount++;

    // trigger voted event
    emit votedEvent(_candidateId);
  }
}
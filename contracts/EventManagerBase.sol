// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.2 <0.9.0;

contract EventManager {
    
    struct Event {
        string name;
        string description;
        string location;
        uint64 capacity;
        uint64 ticketsSold;
        uint64 ticketPrice; // in raw ETH units
        uint256 eventStartDate;
        uint256 eventEndDate;
        string[] images; // array of image URLs
        uint256[] tickets;
        address payable eventHost;
    }

    struct Ticket {
        address holder;
        uint256 boughtTime;
        uint256 eventId;
    }

    event EventCreated(uint256 eventId, string name, uint256 eventStartDate);
    event TicketPurchased(uint256 ticketId, uint256 eventId, address buyer, uint256 price);
    event TicketTransferred(uint256 ticketId, address from, address to);
    event TicketTransferApproved(uint256 ticketId, address owner, address trustee);

    mapping(uint256 => Event) public events;
    mapping(uint256 => Ticket) public tickets;

    mapping(uint256 => mapping(address => bool)) ticketAllowance;

    mapping(address => uint256[]) public userTickets;

    uint256 public eventCounter;
    uint256 public ticketCounter;

    function power(uint base, int8 exponent) private pure returns (uint) {
        require(exponent >= 0, "Exponent must be non-negative");
        uint result = 1;
        for (int8 i = 0; i < exponent; i++) {
            result *= base;
        }
        return result;
    }

    function getEventPriceFlare(uint256 _eventId) public view returns (uint256 _eth) {
        return events[_eventId].ticketPrice;
    }

    function createEvent(string memory _name, string memory _description, string memory _location, uint64 _capacity, uint64 _ticketPrice, uint256 _eventStartDate, uint256 _eventEndDate, string[] memory _images) public returns (uint256 _eventId) {
        events[eventCounter] = Event(_name, _description, _location, _capacity, 0, _ticketPrice, _eventStartDate, _eventEndDate, _images, new uint256[](0), payable(msg.sender));
        eventCounter++;
        emit EventCreated(eventCounter - 1, _name, _eventStartDate);
        return eventCounter - 1;
    }

    function getEventImages(uint256 _eventId) public view returns (string[] memory) {
        require(_eventId < eventCounter, "Invalid event ID");
        return events[_eventId].images;
    }

    function getEventTickets(uint256 _eventId) public view returns (uint256[] memory) {
        require(_eventId < eventCounter, "Invalid event ID");
        return events[_eventId].tickets;
    }

    function buyTicket(uint256 _eventId) public payable returns (uint256 _ticketId) {
        require(_eventId < eventCounter, "Invalid event ID");
        require(events[_eventId].eventStartDate > block.timestamp, "Event has already passed");
        require(events[_eventId].tickets.length < events[_eventId].capacity, "Event is full");

        uint256 ticketCost = getEventPriceFlare(_eventId); // Get ticket price in ETH
        require(msg.value >= ticketCost, "Insufficient value provided"); // Ensure user has paid >= ticket price
        if (msg.value > ticketCost) {
            // Pay any excess the user paid
            (bool sentExcess, ) = msg.sender.call{value: msg.value - ticketCost}("");
            require(sentExcess, "Failed to send ETH excess back to buyer");
        }

        // Create new ticket
        tickets[ticketCounter] = Ticket(msg.sender, block.timestamp, _eventId);

        // Add ticket to user
        userTickets[msg.sender].push(ticketCounter);

        ticketCounter++;

        // Update number of tickets sold
        events[_eventId].tickets.push(ticketCounter - 1);
        events[_eventId].ticketsSold++;

        // Transfer ETH to event host
        (bool sentToHost, ) = events[_eventId].eventHost.call{value: ticketCost}("");
        require(sentToHost, "Failed to send ETH to event host");

        emit TicketPurchased(ticketCounter - 1, _eventId, msg.sender, ticketCost);
        return ticketCounter - 1;
    }

    function transferTicketForce(uint256 _ticketId, address _to) private {
        require(_ticketId < ticketCounter, "Invalid ticket ID");
        require(events[tickets[_ticketId].eventId].eventStartDate > block.timestamp, "Event has already passed");

        address prevHolder = tickets[_ticketId].holder;

        // Get index of ticket in holder's array
        bool found = false;
        uint256 i = 0;
        for (; i < userTickets[prevHolder].length; i++) {
            if (userTickets[prevHolder][i] == _ticketId) {
                found = true;
                break;
            }
        }

        require(found, "Ticket not found in sender's inventory");

        // Remove ticket from holder's array
        for (; i < userTickets[prevHolder].length-1; i++) {
            userTickets[prevHolder][i] = userTickets[prevHolder][i+1];
        }
        userTickets[prevHolder].pop();

        // Add ticket to _to's array
        userTickets[_to].push(_ticketId);

        tickets[_ticketId].holder = _to;

        emit TicketTransferred(_ticketId, prevHolder, _to);
    }

    function approveTicket(uint256 _ticketId, address _to, bool _allowed) public {
        require(_ticketId < ticketCounter, "Invalid ticket ID");
        require(tickets[_ticketId].holder == msg.sender, "You do not own this ticket");
        ticketAllowance[_ticketId][_to] = _allowed;

        emit TicketTransferApproved(_ticketId, msg.sender, _to);
    }

    function transferTicketFrom(uint256 _ticketId, address _to) public {
        require(ticketAllowance[_ticketId][msg.sender], "You are not allowed to transfer this ticket");
        ticketAllowance[_ticketId][msg.sender] = false;
        transferTicketForce(_ticketId, _to);
    }

    function transferTicket(uint256 _ticketId, address _to) public {
        require(_ticketId < ticketCounter, "Invalid ticket ID");
        require(tickets[_ticketId].holder == msg.sender, "You do not own this ticket");
        transferTicketForce(_ticketId, _to);
    }

    function getUserTickets(address _user) public view returns (uint256[] memory _ticketIds) {
        return userTickets[_user];
    }

}

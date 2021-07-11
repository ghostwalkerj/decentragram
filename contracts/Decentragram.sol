//SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.0;

import "hardhat/console.sol";

contract Decentragram {
	string public name = "Decentragram";

	// Store images
	uint256 public imageCount = 0;
	mapping(uint256 => Image) public images;

	struct Image {
		uint256 id;
		string hash;
		string description;
		uint256 tipAmount;
		address payable author;
	}
	event ImageCreated(Image _image);

	event ImageTipped(Image _image);

	// Create images
	function uploadImage(string memory _imgHash, string memory _description)
		public
	{
		require(bytes(_description).length > 0, "Description required");
		require(bytes(_imgHash).length > 0, "ImageHash required");
		require(msg.sender != address(0x0), "Bad Sender");
		imageCount++;

		Image memory image = Image(
			imageCount,
			_imgHash,
			_description,
			0,
			payable(msg.sender)
		);
		images[imageCount] = image;

		emit ImageCreated(image);
	}

	// Tip images
	function tipImageOwner(uint256 _id) public payable {
		console.log(_id);
		console.log(imageCount);
		require(_id > 0 && _id <= imageCount, "Invalid Image ID");

		Image memory _image = images[_id];

		address payable _author = _image.author;

		_image.tipAmount += msg.value;

		images[_id] = _image;

		_author.transfer(msg.value);

		emit ImageTipped(_image);
	}
}

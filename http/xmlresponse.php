<?php
/**
 * ownCloud - Secure Container
 *
 * @author Lukas Zurschmiede
 * @copyright 2015 Lukas Zurschmiede <l.zurschmiede@ranta.ch>
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU AFFERO GENERAL PUBLIC LICENSE
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU AFFERO GENERAL PUBLIC LICENSE for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with this library.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Public interface of ownCloud for apps to use.
 * secure_container\Http\XMLResponse class
 */

namespace OCA\secure_container\Http;

use \OCP\AppFramework\Http;
use \OCP\AppFramework\Http\Response;

/**
 * A generic XMLResponse class that is used to return javascript responses.
 */
class XMLResponse extends Response {
	
	/**
	 * Response data as an Array to traverse into XML
	 * @var array [ key = value|array [ key = value|array [ key = value|... ] ] ]
	 */
	protected $data = '';
	
	/**
	 * The simple XML document to return
	 * @var \SimpleXMLElement Root-Tag: secure_container
	 */
	protected $xml;
	
	/**
	 * Class constructor
	 * 
	 * @param array $data The script content to render
	 */
	public function __construct(array $data) {
		$this->data = $data;
		$this->xml = new \SimpleXMLElement('<secure_container/>');
		$this->addHeader('Content-Type', 'text/xml; charset=UTF-8');
		$this->setStatus(Http::STATUS_OK);
	}
	
	/**
	 * Renders the script out as plain text.
	 * 
	 * @return string
	 */
	public function render() {
		$this->appendChild($this->data, $this->xml);
		return $this->xml->asXml();
	}
	
	/**
	 * Appending SubElements to the SimpleXMLElement
	 *
	 * @param array $data Data to travers to XML
	 * @param SimpleXMLElement $parent The XML-Element to append the childs or values to
	 *
	 * @return SimpleXMLElement
	 */
	protected function appendChild(array $data, \SimpleXMLElement $parent) {
		if ($data == null) {
			$data = $this->data;
		}
		foreach ($data as $k => $val) {
			if (is_numeric($k)) {
				$tag_name = 'value';
			}
			else {
				$tag_name = preg_replace('/[^a-z0-9_]/smi', '', strtolower($k));
			}
			
			$child = $parent->addChild($tag_name, is_array($val) ? $this->appendChild($val) : $val);
		}
		return $child;
	}
}

<?php
/**
 * ownCloud - Secure Container
 *
 * @author Lukas Zurschmiede
 * @copyright 2014 Lukas Zurschmiede <l.zurschmiede@ranta.ch>
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

namespace OCA\secure_container\Controller;

use \OCP\IRequest;
use \OCP\IConfig;
use \OCP\AppFramework\Http;
use \OCP\AppFramework\Http\TemplateResponse;
use \OCP\AppFramework\Http\JSONResponse;
use \OCP\AppFramework\Http\XMLResponse;
use \OCP\AppFramework\Controller;

use \OCA\secure_container\Http\ScriptResponse;

use \OCA\secure_container\Db\PathMapper;
use \OCA\secure_container\Db\PathTree;
use \OCA\secure_container\Db\ContentMapper;
use \OCA\secure_container\Db\Path;
use \OCA\secure_container\Db\Content;

class PageController extends Controller {
	/**
	 * ID to use for the trash folder
	 * 
	 * @const int
	 */
	const TRASH_PARENT_ID = 0;
	
	/**
	 * The Username from the currently logged in user
	 * 
	 * @var int
	 */
	private $userId;
	
	/**
	 * Configuration - not used as of now
	 * 
	 * @var \OCP\IConfig
	 */
	private $config;
	
	/**
	 * Database mapper object for the pathes
	 * 
	 * @var \OCA\secure_container\Db\PathMapper
	 */
	private $pathMapper;
	
	/**
	 * Database mapper object for the entries
	 * 
	 * @var \OCA\secure_container\Db\ContentMapper
	 */
	private $contentMapper;
	
	/**
	 * Translation object
	 * 
	 * @var \OC_L10N
	 */
	private $trans;

	/**
	 * Instantiate a new PageController.
	 * 
	 * @see \OCA\secure_container\AppInfo\App
	 * 
	 * @param string $appName The Application name
	 * @param \OCP\IRequest $request The Request made from the client
	 * @param string $userId The currently logged in username
	 * @param \OCP\IConfig $config The configuration object for this instance
	 * @param \OCA\secure_container\Db\PathMapper $pathMapper Database mapper object for the pathes
	 * @param \OCA\secure_container\Db\ContentMapper $contentMapper Database mapper object for the entries
	 */
	public function __construct($appName, IRequest $request, $userId, IConfig $config, PathMapper $pathMapper, ContentMapper $contentMapper){
		parent::__construct($appName, $request);
		
		$this->trans = \OC_L10N::get('secure_container');
		$this->userId = $userId;
		$this->config = $config;
		$this->pathMapper = $pathMapper;
		$this->contentMapper = $contentMapper;
	}

	/**
	 * The main index page which shows the path tree on left and the encrypted
	 * containers in the content - above a breadcrumb like in the files section.
	 * 
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 */
	public function index() {
		$params = array('user' => $this->userId);
		
		// Get all pathes and create an appropriate structure to use in the templates.
		$params['navigation'] = $this->pathMapper->findPathTree();
		
		// Sytstem wide values
		//$this->config->setSystemValue('foo', 'bar');
		//$this->config->getSystemValue('foo');
		
		// Application global values
		//$this->config->setAppValue($this->appName, 'foo', 'bar');
		//$this->config->getAppValue($this->appName, 'foo');
		
		// User valuesinside the application
		//$this->config->setSystemValue($this->userId, $this->appName, 'foo', 'bar');
		//$this->config->getSystemValue($this->userId, $this->appName, 'foo');
		
		// templates/main.php
		return new TemplateResponse($this->appName, 'main', $params);
	}

	/**
	 * This is a wrapper for retrieve 3rd party scripts.
	 * 
	 * @param string $name The 3rd'party script to return.
	 * 
	 * @return DataResponse|JSONResponse
	 * 
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 */
	public function scriptwrapper($name) {
		$app_dir = \OC_App::getInstallPath() . DIRECTORY_SEPARATOR . 'secure_container' . DIRECTORY_SEPARATOR . 'js' . DIRECTORY_SEPARATOR . '3rdparty' . DIRECTORY_SEPARATOR;
		$content = '';
		$wrapper_function = 'js_wrapper';
		$wrapper_code = '';
		
		switch (strtolower($name)) {
			case 'sjcl':
				$file = $app_dir . 'sjcl' . DIRECTORY_SEPARATOR . 'sjcl.js';
				$content = file_get_contents($file);
				$wrapper_function = 'OC_SJCL';
				$wrapper_code = 'this.sjcl = sjcl;';
				break;
			default:
				$content = '';
		}
		
		$response = 'function __' . $wrapper_function . '() { ' . $content . chr(10) . $wrapper_code . ' }' . chr(10);
		$response .= 'var ' . $wrapper_function . ' = new __' . $wrapper_function . '();';
		
		return new ScriptResponse($response);
	}

	/**
	 * Simple method which posts back all entries from inside a path.
	 * 
	 * @param string $path Path to return the main elements from
	 * 
	 * @return JSONResponse|XMLResponse
	 * 
	 * @NoAdminRequired
	 */
	public function entries($path) {
		$entries = $this->contentMapper->findAll($path);
		$response = $this->getResponseSkeleton('list');
		$this->appendContentEvent('clear', null, $response);
		$this->appendContentEvent('insert', $entries, $response);
		return new JSONResponse($response);
	}
	
	/**
	 * Simple method which posts back all entries from inside a path.
	 * 
	 * @param string $path Path to return the main elements from
	 * 
	 * @return JSONResponse|XMLResponse
	 * 
	 * @NoAdminRequired
	 */
	public function trash($path) {
		$entries = $this->contentMapper->findAll(-1);
		$response = $this->getResponseSkeleton('list');
		$this->appendContentEvent('clear', null, $response);
		$this->appendContentEvent('insert', $entries, $response);
		return new JSONResponse($response);
	}
	
	/**
	 * Returns a single SecureContainer entry
	 * 
	 * @param string $guid The ID of the entry to get the details from.
	 * 
	 * @return JSONResponse|XMLResponse
	 * 
	 * @NoAdminRequired
	 */
	public function show($guid) {
		try {
			$response = $this->contentMapper->find($guid);
		} catch (\Exception $ex) {
			return $this->createResponseException($ex, 'content', Http::STATUS_INTERNAL_SERVER_ERROR);
		}
		return new JSONResponse($response);
	}
	
	/**
	 * Create and update a SecureContainer element
	 * 
	 * @param int $guid The ID of the entry to get the details from.
	 * 
	 * @return JSONResponse|XMLResponse
	 * 
	 * @NoAdminRequired
	 */
	public function save($guid) {
		try {
			// Check for a valid post data format
			$data = (object) $this->request->post;
			if (!is_object($data) || !isset($data->name)) {
				throw new \Exception('Invalid data posted for create a new entry in SecureContainer.');
			}
			
			// Create the response
			$response = $this->getResponseSkeleton('content');
			
			// Create or Update the entity.
			if ($this->contentMapper->exists($guid)) {
				$entity = $this->contentMapper->find($guid);
				$entity->setName($data->name);
				$entity->setPath(intval($data->section));
				$entity->setValue($data->value);
				$entity->setDescription($data->description);
				$this->contentMapper->update($entity);
				
				$this->appendContentEvent('replace', $entity, $response);
			}
			else {
				$entity = new Content();
				$entity->setUid($this->userId);
				$entity->setName($data->name);
				$entity->setPath(intval($data->section));
				$entity->setValue($data->value);
				$entity->setDescription($data->description);
				$entity = $this->contentMapper->insert($entity);
				
				$this->appendContentEvent('insert', array($entity), $response);
			}
		} catch (\Exception $ex) {
			return $this->createResponseException($ex, 'content', Http::STATUS_INTERNAL_SERVER_ERROR);
		}
		return new JSONResponse($response);
	}
	
	/**
	 * Delete a SecureContainer element
	 * 
	 * @param int $guid The ID of the entry to delete
	 * 
	 * @return JSONResponse|XMLResponse
	 * 
	 * @NoAdminRequired
	 */
	public function delete($guid) {
		// Check for a valid post data format
		$data = (object) $this->request->post;
		if (!is_object($data) || !isset($data->id)) {
			throw new \Exception('Invalid data posted for remove an entry in SecureContainer.');
		}
		if (!isset($data->moveToTrash) || ($data->moveToTrash === TRUE)) {
			return $this->move($guid, self::TRASH_PARENT_ID);
		}
		else {
			return $this->shredder($guid);
		}
	}
	
	/**
	 * Completely trashes (delete) a SecureContainer Element
	 *
	 * @param int $guid The ID of the entry to shredder
	 *
	 * @return JSONResponse|XMLResponse
	 *
	 * @NoAdminRequired
	 */
	public function shredder($guid) {
		try {
			if ($this->contentMapper->exists($guid)) {
				$entity = $this->contentMapper->find($guid);
				$this->contentMapper->delete($entity);
			}
			else {
				throw new \Exception('Invalid Entry-ID given to shredder.');
			}
		} catch (\Exception $ex) {
			return $this->createResponseException($ex, 'content', Http::STATUS_INTERNAL_SERVER_ERROR);
		}
		
		// Create the response
		$response = $this->getResponseSkeleton('content');
		$this->appendContentEvent('delete', array('guid' => $guid), $response);
		return new JSONResponse($response);
	}
	
	/**
	 * Move a SecureContainer element into an other path
	 * 
	 * @param int $guid The ID of the entry to move
	 * @param int $path The ID of path to move the entry into
	 * 
	 * @return JSONResponse|XMLResponse
	 * 
	 * @NoAdminRequired
	 */
	public function move($guid, $path) {
		try {
			if ($this->contentMapper->exists($guid)) {
				$entity = $this->contentMapper->find($guid);
				$entity->setPath((int)$path);
				$this->contentMapper->update($entity);
			}
			else {
				throw new \Exception('Invalid Entry-ID given to move.');
			}
			
			// Create the response
			$response = $this->getResponseSkeleton('content');
			$this->appendContentEvent('delete', array('guid' => $guid), $response);
		} catch (\Exception $ex) {
			return $this->createResponseException($ex, 'content', Http::STATUS_INTERNAL_SERVER_ERROR);
		}
		return new JSONResponse($response);
	}
	
	/**
	 * Simple method which posts back all sections aka paths.
	 * 
	 * @return JSONResponse|XMLResponse
	 * 
	 * @NoAdminRequired
	 */
	public function sections() {
		$response = $this->pathMapper->findPathTree();
		return new JSONResponse($response);
	}
	
	/**
	 * Create and update a SecureContainer path
	 * 
	 * @param string $guid The ID of the path to upgrade - or null for a new one
	 * 
	 * @return JSONResponse
	 * 
	 * @NoAdminRequired
	 */
	public function section($guid) {
		try {
			// Check for a valid post data format
			$data = (object) $this->request->post;
			if (!is_object($data) || !isset($data->name)) {
				throw new \Exception('Invalid data posted for create a new path in SecureContainer.');
			}
			
			// Create the response
			$response = $this->getResponseSkeleton('section');
			
			// Create or Update the entity.
			if ($this->pathMapper->exists($guid)) {
				$entity = $this->pathMapper->find($guid);
				if (isset($data->name)) {
					$entity->setName($data->name);
				}
				if (isset($data->parentId)) {
					$data->parentId = intval($data->parentId);
					$entity->setParent($data->parentId < 0 ? 0 : $data->parentId);
				}
				$this->pathMapper->update($entity);
				
				$this->appendNavigationEvent('update', array($entity), $response);
			}
			else {
				$data->parentId = intval($data->parentId);
				$entity = new Path();
				$entity->setUid($this->userId);
				$entity->setName($data->name);
				$entity->setParent($data->parentId < 0 ? 0 : $data->parentId);
				$entity = $this->pathMapper->insert($entity);
				
				$this->appendNavigationEvent('insert', array($entity), $response);
			}
		} catch (\Exception $ex) {
			return $this->createResponseException($ex, 'section', Http::STATUS_INTERNAL_SERVER_ERROR);
		}
		return new JSONResponse($response);
	}
	
	/**
	 * Delete a section container and optionally moves the contents into a different folder
	 * 
	 * @param string $guid The ID of the path to delete
	 * 
	 * @return JSONResponse
	 * 
	 * @NoAdminRequired
	 */
	public function sectionDelete($guid) {
		try {
			// Check for a valid post data format
			$data = (object) $this->request->post;
			if (!is_object($data) || !isset($data->section)) {
				throw new \Exception('Invalid data posted for remove a section in SecureContainer.');
			}
			$move = !isset($data->moveToTrash) || ($data->moveToTrash ==! false);
			
			if ($this->pathMapper->exists($guid)) {
				$entity = $this->pathMapper->find($guid);
				$this->deletePathEntry($entity, $move);
			}
			else {
				throw new \Exception('Invalid Path-ID ' . $guid . ' given to delete.');
			}
			
			// Create the response
			$response = $this->getResponseSkeleton('section');
			$this->appendNavigationEvent('delete', array('id' => $guid), $response);
		} catch (\Exception $ex) {
			return $this->createResponseException($ex, 'section', Http::STATUS_INTERNAL_SERVER_ERROR);
		}
		return new JSONResponse($response);
	}
	
	/**
	 * Removes all path entries and the contents recursively
	 * 
	 * @param \OCA\secure_container\Db\Path $path Path to delete
	 * @param boolean $move Move the entries to the trash instead of delete
	 */
	private function deletePathEntry($path, $move) {
		// Get all path children and walk down to begin the delete process on deepest level
		$children = $this->pathMapper->findChildren($path->getId());
		foreach ($children as $child) {
			$this->deletePathEntry($child, $move);
		}
		
		// Delete all entries in this path and finally delete the path itself
		$entries = $this->contentMapper->findAll($path->getId());
		foreach ($entries as $entry) {
			if ($move) {
				$entry->setPath(self::TRASH_PARENT_ID);
				$this->contentMapper->update($entry);
			}
			else {
				$this->contentMapper->delete($entry);
			}
		}
		$this->pathMapper->delete($path);
	}
	
	/**
	 * Returns the base response Skeleton for any JSON or XML request.
	 * 
	 * @param string callee The called function/route
	 * 
	 * @return object
	 */
	private function getResponseSkeleton($callee) {
		return (object) array(
			'type' => 'response',
			'callee' => $callee,
		);
	}
	
	/**
	 * Appends a navigation event ot the response
	 * 
	 * @param string event The event to trigger
	 * @param object|array The event data to send
	 * @param object response Reference to the response object
	 */
	private function appendNavigationEvent($event, $data, &$response) {
		if (!isset($response->navigation) || !is_array($response->navigation)) {
			$response->navigation = array();
		}
		$response->navigation[] = (object) array(
			'event' => $event,
			'data' => (object) $data,
		);
	}
	
	/**
	 * Appends a content event ot the response
	 * 
	 * @param string event The event to trigger
	 * @param object|array The event data to send
	 * @param object response Reference to the response object
	 */
	private function appendContentEvent($event, $data, &$response) {
		if (!isset($response->content) || !is_array($response->content)) {
			$response->content = array();
		}
		$response->content[] = (object) array(
			'event' => $event,
			'data' => (object) $data,
		);
	}
	
	/**
	 * Creates a standard response with exception data
	 * 
	 * @param \Exception ex The exception to send back
	 * @param string callee The calle function/route
	 * @param int code HTTP Status code to return, default to Http::STATUS_INTERNAL_SERVER_ERROR
	 * 
	 * @return JSONResponse
	 */
	private function createResponseException(\Exception $ex, $callee, $code = Http::STATUS_INTERNAL_SERVER_ERROR) {
		$response = new JSONResponse((object) array(
			'type' => 'error',
			'callee'=> $callee,
			'exception' => get_class($ex),
			'message' => $ex->getMessage(),
		));
		$response->setStatus($code);
		return $response;
	}
}

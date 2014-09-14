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

namespace OCA\secure_container\Db;

use \OCP\IDb;
use \OCP\AppFramework\Db\Mapper;

class ContentMapper extends Mapper {
	private $table = 'secure_cont_entry';
	private $uid;
	
	public function __construct(IDb $db, $uid) {
		parent::__construct($db, $this->table, 'OCA\secure_container\Db\Content');
		$this->uid = $uid;
	}
	
	/**
	 * @throws \OCP\AppFramework\Db\DoesNotExistException if not found
	 * @throws \OCP\AppFramework\Db\MultipleObjectsReturnedException if more than one result
	 */
	public function find($id) {
		$sql = 'SELECT * FROM `*PREFIX*' . $this->table . '` WHERE `id` = ? AND `uid` = ?;';
		return $this->findEntity($sql, array($id));
	}
	
	/**
	 * @throws \OCP\AppFramework\Db\DoesNotExistException if not found
	 * @throws \OCP\AppFramework\Db\MultipleObjectsReturnedException if more than one result
	 */
	public function findAll($path, $limit = null, $offset = null) {
		$sql = 'SELECT * FROM `*PREFIX*' . $this->table . '` WHERE `path` = ? AND `uid` = ?;';
		return $this->findEntities($sql, $limit, $offset, array($path, $this->uid));
	}
	
	/**
	 * @throws \OCP\AppFramework\Db\DoesNotExistException if not found
	 * @throws \OCP\AppFramework\Db\MultipleObjectsReturnedException if more than one result
	 */
	public function findByName($name, $limit = null, $offset = null) {
		$name = '%' . $name . '%';
		$sql = 'SELECT * FROM `*PREFIX*' . $this->table . '` WHERE `name` LIKE ? AND `uid` = ?;';
		return $this->findEntities($sql, $limit, $offset, array($name, $this->uid));
	}
	
	/**
	 * @throws \OCP\AppFramework\Db\DoesNotExistException if not found
	 * @throws \OCP\AppFramework\Db\MultipleObjectsReturnedException if more than one result
	 */
	/*public function findByName($name) {
		$sql = 'SELECT COUNT(*) AS `count` FROM `*PREFIX*' . $this->table . '` WHERE `name` = ?';
		$query = $this->db->prepareQuery($sql);
		$query->bindParam(1, $name, \PDO::PARAM_STR);
		$result = $query->execute();
		
		while($row = $result->fetchRow()) {
			return $row['count'];
		}
	}*/
	
}


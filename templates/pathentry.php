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

$path = $_['path'];
$level = intval($_['level']);
?>
<li class="icon-filetype-folder svg" id="path-entry-<?php p($path->getId()); ?>" data-id="<?php p($path->getId()); ?>"><span class="path-label"><?php p($path->getName()); ?></span>
	<ul class="level-<?php p($level); ?> path-childs" id="path-childs-<?php p($path->getId()); ?>">
		<?php foreach ($path as $k => $child): ?>
		<?php print_unescaped($this->inc('pathentry', array('path' => $child, 'level'=> $level + 1))); ?>
		<?php endforeach; ?>
	</ul>
</li>


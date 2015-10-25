TODO:
* rethink typeof this.close === 'undefined' in BaseList.allPossibleChildrenInactive
* reset hm-item-intends-to-open-child-list attr on container after inter-menu action
* make local changes wait on inter-menu changes
* is MenuManager.loadComponent the right way to go?
* optimize inheritance
  * make lists out of both menu container and uls
  * make items out of both menus and lis
  * most likely create BaseItem and BaseList classes
* restrict clicking of anchors to ones with parents that have class that designates children

Done:
* have observers register to a certain channel
* handle closing open list
* determine if List property childIntendsToOpen should be getter/setter
* determine if List static method assignOpenState is redundant compared to openState setter
* add animation to opening/closing
* change receiveNotification from switch to dynamic case to something like handleMessageThatMessageName
* handle active trail 
* trigger setActiveTrail on mouseoff
* move classes to own module
* make option to pass in animation duration
* even/odd row classes

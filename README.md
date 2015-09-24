TODO:
* a big problem: because children and parents are observers, a significant amount of echoes are occurring
* * i.e. when a parent notifies a child, the child notifies the parent right back.
* * specifically, this breaks the item-is-inactive message because an inactive child first notifies the parent of its inactive state after receiving a message. then, child notifies  

* have observers register to a certain channel



* find elegant way to make top-level ul always open, maybe
* determine if List static method assignOpenState is redundant compared to openState setter
* improve Item hasChild and getChildOpenState combo
* handle active trail

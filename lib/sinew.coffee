(->
    _moduleAvailable = (typeof module isnt "undefined")
    _windowAvailable = (typeof window is "object")
    _isServer = (_moduleAvailable and !_windowAvailable)
    _setEnvironment = if _isServer then "server" else "client"

    environment = {
        isServer: ()->
            return (_setEnvironment is "server")
        isClient: ()->
            return (_setEnvironment is "client")
    }

    # Uh, Super Intelligent New?
    Sinew = (options)->
        # enable omission of the new keyword without global leaking!
        makeNew = (object, Constructor)->
            if (typeof object is 'undefined') or (object is null)
                throw new TypeError "Expected object as first parameter."
            if (typeof Constructor isnt 'function')
                throw new TypeError "Expected Constructor to be a function."    
            if (object instanceof Constructor) is false
                object = new Constructor()
            return object
        self = makeNew @, Sinew
        self._defaults = {
            # the function used to filter blacklisted properties
            filter: (property)->
                return property.substr(0, 1) != '_'
            pawnClientOnly: true
        }

        ###*
        Filter the keys of a given object using the self._options.filter
        @method _filterProperties
        @param {Object} ofObject
        ###
        self._filterProperties = (ofObject)->
            filter = self._options.filter
            # we need to use our default filter if we're
            # filtering our own object
            if ofObject is self
                filter = self._defaults.filter
            # return _(ofObject).keys().filter(filter).value()
            result = (element for element, value of ofObject when filter(element))
            return result

        ###*
        Create a shell object with privatized functions
        @method _publicize
        @param {Object} object
        ###
        self._publicize = (object)->
            filteredProps = self._filterProperties(object)
            publicObject = {}
            copy = (name)->
                publicObject[name] = object[name]
                return
            copy prop for prop in filteredProps
            return publicObject

        ###*
        Add a property to an object context, and create a noConflict
        method on said property if the property previously existed
        @method pawn
        @param {String} name
        @param {Object} object
        @param {context} object
        ###
        self.pawn = (name, object, context=null)->
            # default to no-op if not explicitly enabled
            if self._options.pawnClientOnly and environment.isServer()
                # failure
                return false
            # fail if we got bad parameters
            if typeof name isnt 'string'
                throw new TypeError "Expected pawn's name to be string." 
            if (typeof object isnt 'object') or (object is null)
                throw new TypeError "Expected pawn's definition to be object." 
            if (typeof context is 'object') and (context is null)
                context = window
            if (typeof context isnt 'object')
                throw new TypeError "Expected pawn's new context to be object."
            # prior definition
            definition = {
                prior: null
            }
            # store a reference to the previous property if it exists
            if typeof context[name] isnt 'undefined'
                definition.prior = context[name]
            # set our object as a property of context
            context[name] = object
            # add a noConflict function if prior definition exists
            if definition.prior isnt null
                object.noConflict = ()->
                    release = context[name]
                    context[name] = definition.prior
                    delete release.noConflict
                    return release
            # success!
            return true

        # assign makeNew as a property of self
        self.makeNew = makeNew
        # alias!
        self.forceNew = self.makeNew

        ###*
        Create a privatized object, and auto-enforce new keyword on construction
        @method create
        @alias setup
        @param {Object} object
        @param {Function} Constructor
        ###
        self.setup = self.create = (object = null, Constructor = null)->
            try
                object = self.makeNew(object, Constructor)
                publicizedObject = self._publicize(object)
                return publicizedObject
            catch e
                console.warn "Error during structured instantiation: ", e
                console.log "Object Reference: ", object
                throw e

        extend = (x, y)->
            for property, value of y
                x[property] = value
            return x

        ###*
        Construct our sinewy object
        @method _construct
        @private
        @param {Object} opts
        ###
        self._construct = (opts)->
            # create a temporary options object
            defaults = extend {}, self._defaults
            options = extend defaults, opts
            # barf if we got a bad filter function
            if typeof options.filter isnt 'function'
                throw new TypeError "Expected options.filter to be a function."
            if typeof options.filter('test') isnt 'boolean'
                throw new Error "Expected options.filter to give a boolean response."
            # save our options to a private reference
            self._options = options
            # use our own powers to privatize self
            privateObject = self.create(self, Sinew)
            return privateObject

        # constructify!
        return self._construct(options)

    module.exports = Sinew
)()